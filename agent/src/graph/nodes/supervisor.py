"""Supervisor 노드: 의도 분류 + 가드레일 + 라우팅"""

import json
import logging

from langchain_core.messages import AIMessage

from ...llm.factory import call_llm, select_model
from ...llm.prompts import (
    SUPERVISOR_SYSTEM_PROMPT,
    CONTACT_RESPONSE,
    GREETING_RESPONSE,
)
from ..guardrail import check_guardrail
from ..state import AgentState

logger = logging.getLogger(__name__)


def _extract_last_user_message(state: AgentState) -> str:
    """마지막 사용자 메시지 텍스트 추출"""
    messages = state.get("messages", [])
    for msg in reversed(messages):
        if hasattr(msg, "type") and msg.type == "human":
            content = msg.content
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                return " ".join(
                    part.get("text", "") if isinstance(part, dict) else str(part)
                    for part in content
                )
    return ""


async def supervisor_node(state: AgentState) -> AgentState:
    """Supervisor 노드 실행

    1. Flash로 의도 분류
    2. 가드레일 판정
    3. CONTACT/GREETING은 직접 응답
    4. 나머지는 라우팅 정보만 설정
    """
    user_message = _extract_last_user_message(state)
    guardrail_count = state.get("guardrail_count", 0)

    updates: dict = {
        "thinking": "질문 의도를 파악하고 있습니다...",
        "guardrail_count": guardrail_count,
        "session_ended": state.get("session_ended", False),
        "rag_results": [],
        "needs_grounding": False,
    }

    if not user_message:
        updates["intent"] = "GREETING"
        updates["model_choice"] = "flash"
        return updates

    # 의도 분류 (Flash)
    intent = "OUT_OF_SCOPE"
    try:
        classification_result = await call_llm(
            model_name="flash",
            system_prompt=SUPERVISOR_SYSTEM_PROMPT,
            user_prompt=user_message,
        )

        # JSON 파싱
        raw = classification_result.strip()
        # 마크다운 코드 블록 제거
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)
        intent = parsed.get("intent", "OUT_OF_SCOPE").upper()

        valid_intents = {"CAREER", "TECHNICAL", "CONTACT", "GREETING", "OUT_OF_SCOPE", "ABUSE"}
        if intent not in valid_intents:
            intent = "OUT_OF_SCOPE"

        logger.info(f"[Supervisor] intent={intent}, confidence={parsed.get('confidence', 0)}")

    except json.JSONDecodeError as e:
        logger.warning(f"[Supervisor] JSON parse failed: {e}, raw={classification_result!r}")
        # 텍스트에서 intent 키워드 추출 시도
        for kw in ("CAREER", "TECHNICAL", "CONTACT", "GREETING", "ABUSE"):
            if kw in classification_result.upper():
                intent = kw
                break
    except Exception as e:
        logger.error(f"[Supervisor] Classification failed: {e}")
        intent = "OUT_OF_SCOPE"

    # 가드레일 판정
    guardrail_result = check_guardrail(intent, guardrail_count)
    updates["guardrail_count"] = guardrail_result["new_count"]
    updates["session_ended"] = guardrail_result["session_ended"]
    updates["intent"] = intent
    updates["model_choice"] = select_model(intent, user_message)

    # 차단 처리: 직접 응답 메시지 추가
    if guardrail_result["action"] in ("SOFT_BLOCK", "HARD_BLOCK", "SESSION_END"):
        updates["thinking"] = ""
        updates["messages"] = [AIMessage(content=guardrail_result["response"])]
        return updates

    # CONTACT: 연락처 직접 안내
    if intent == "CONTACT":
        updates["thinking"] = ""
        updates["messages"] = [AIMessage(content=CONTACT_RESPONSE)]
        return updates

    # GREETING: 환영 메시지
    if intent == "GREETING":
        updates["thinking"] = ""
        updates["messages"] = [AIMessage(content=GREETING_RESPONSE)]
        return updates

    # CAREER / TECHNICAL: 다음 노드로 라우팅
    if intent == "CAREER":
        updates["thinking"] = "Career Agent에 연결 중..."
    else:
        updates["thinking"] = "Technical Agent에 연결 중..."

    return updates
