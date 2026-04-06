"""Agent router: AG-UI protocol endpoint for PortfolioLive + health check"""

import uuid
import asyncio
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage

from ag_ui.core.events import (
    EventType,
    RunStartedEvent,
    RunFinishedEvent,
    TextMessageStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    StateDeltaEvent,
)
from ag_ui.core.types import RunAgentInput
from ag_ui.encoder import EventEncoder

from ..graph.portfolio_agent import portfolio_graph

logger = logging.getLogger(__name__)
router = APIRouter(tags=["agent"])


# ────────────────────────────────────────────
# Health check
# ────────────────────────────────────────────

@router.get("/agent/health")
async def health_check():
    return {"status": "ok"}


# ────────────────────────────────────────────
# 유틸 함수
# ────────────────────────────────────────────

def _extract_last_user_content(messages: list) -> str:
    """AG-UI 메시지 목록에서 마지막 user 메시지 텍스트 추출"""
    for msg in reversed(messages):
        role = msg.get("role", "")
        if role != "user":
            continue
        content = msg.get("content", "")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return " ".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
    return ""


def _build_history_messages(messages: list) -> list:
    """AG-UI 메시지 목록을 LangChain 메시지 리스트로 변환 (마지막 user 제외)"""
    from langchain_core.messages import HumanMessage, AIMessage

    lc_messages = []
    for i, msg in enumerate(messages):
        role = msg.get("role", "")
        content = msg.get("content", "")
        if isinstance(content, list):
            content = " ".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )

        # 마지막 user 메시지는 별도로 처리
        if i == len(messages) - 1 and role == "user":
            break

        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))

    return lc_messages


# ────────────────────────────────────────────
# Agent 실행 + SSE 스트리밍
# ────────────────────────────────────────────

async def run_portfolio_agent(body: dict) -> AsyncGenerator[str, None]:
    """PortfolioLive 에이전트 실행 + AG-UI 이벤트 스트리밍"""
    encoder = EventEncoder()
    thread_id = body.get("threadId", str(uuid.uuid4()))
    run_id = str(uuid.uuid4())
    messages = body.get("messages", [])

    # RUN_STARTED
    yield encoder.encode(RunStartedEvent(
        type=EventType.RUN_STARTED,
        thread_id=thread_id,
        run_id=run_id,
    ))

    # 사용자 메시지 추출
    last_user_content = _extract_last_user_content(messages)
    history_messages = _build_history_messages(messages)

    # 초기 thinking 상태 전송
    try:
        yield encoder.encode(StateDeltaEvent(
            type=EventType.STATE_DELTA,
            delta=[{
                "op": "replace",
                "path": "/thinking",
                "value": "질문 의도를 파악하고 있습니다...",
            }],
        ))
    except Exception:
        pass

    # LangGraph 실행
    message_id = str(uuid.uuid4())
    response_text = ""

    try:
        # 초기 상태 구성
        initial_state = {
            "messages": history_messages + [HumanMessage(content=last_user_content)],
            "thinking": "",
            "intent": "",
            "guardrail_count": 0,
            "model_choice": "flash",
            "rag_results": [],
            "session_ended": False,
            "needs_grounding": False,
        }

        # 타임아웃 30초
        result = await asyncio.wait_for(
            portfolio_graph.ainvoke(initial_state),
            timeout=30.0,
        )

        # 마지막 AI 메시지 추출
        result_messages = result.get("messages", [])
        for msg in reversed(result_messages):
            if hasattr(msg, "type") and msg.type == "ai":
                response_text = msg.content if isinstance(msg.content, str) else str(msg.content)
                break

        if not response_text:
            response_text = "죄송합니다. 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요."

        # thinking 상태 초기화
        try:
            yield encoder.encode(StateDeltaEvent(
                type=EventType.STATE_DELTA,
                delta=[{
                    "op": "replace",
                    "path": "/thinking",
                    "value": "",
                }],
            ))
        except Exception:
            pass

    except asyncio.TimeoutError:
        logger.error("[AgentRouter] LangGraph timeout after 30s")
        response_text = "잠시 후 다시 시도해주세요. 현재 응답 생성에 시간이 걸리고 있습니다."

    except Exception as e:
        logger.error(f"[AgentRouter] Agent execution failed: {e}", exc_info=True)

        err_msg = str(e).lower()
        if "quota" in err_msg or "rate" in err_msg or "429" in err_msg:
            response_text = "현재 요청이 많습니다. 잠시 후 다시 시도해주세요."
        elif "timeout" in err_msg:
            response_text = "잠시 후 다시 시도해주세요. 현재 응답 생성에 시간이 걸리고 있습니다."
        else:
            response_text = "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

    # 텍스트 메시지 스트리밍
    yield encoder.encode(TextMessageStartEvent(
        type=EventType.TEXT_MESSAGE_START,
        message_id=message_id,
        role="assistant",
    ))

    # 단어 단위로 스트리밍
    words = response_text.split(" ")
    for i, word in enumerate(words):
        chunk = word if i == 0 else f" {word}"
        yield encoder.encode(TextMessageContentEvent(
            type=EventType.TEXT_MESSAGE_CONTENT,
            message_id=message_id,
            delta=chunk,
        ))
        await asyncio.sleep(0.02)

    yield encoder.encode(TextMessageEndEvent(
        type=EventType.TEXT_MESSAGE_END,
        message_id=message_id,
    ))

    # RUN_FINISHED
    yield encoder.encode(RunFinishedEvent(
        type=EventType.RUN_FINISHED,
        thread_id=thread_id,
        run_id=run_id,
    ))


# ────────────────────────────────────────────
# 엔드포인트
# ────────────────────────────────────────────

@router.post("/awp")
async def agent_run_endpoint(request: Request):
    """AG-UI protocol endpoint for PortfolioLive CopilotKit agent"""
    body = await request.json()
    return StreamingResponse(
        run_portfolio_agent(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
