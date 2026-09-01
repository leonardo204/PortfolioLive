"""Grounding 노드: 웹 검색 폴백 (AI 프록시 경유)

RAG 결과가 부족할 때만 실행된다. 프록시 앱 설정의 'grounding' 용도가
웹검색이 켜진 모델(:online)로 매핑돼 있어, 앱은 용도 이름만 보낸다.
"""

import asyncio
import logging

from langchain_core.messages import AIMessage

from ...llm.factory import ProxyError, call_llm_grounded
from ...llm.prompts import GROUNDING_SYSTEM_PROMPT
from ..state import AgentState

logger = logging.getLogger(__name__)

# 웹검색은 토큰 비용과 별개로 검색료가 붙는다. 한 질문당 1회만 실행한다.
GROUNDING_TIMEOUT = 25.0
GROUNDING_MAX_TOKENS = 1024


def _extract_last_user_message(state: AgentState) -> str:
    """마지막 사용자 메시지 추출"""
    messages = state.get("messages", [])
    for msg in reversed(messages):
        if hasattr(msg, "type") and msg.type == "human":
            if isinstance(msg.content, str):
                return msg.content
            return str(msg.content)
    return ""


def _get_last_ai_response(state: AgentState) -> str:
    """마지막 AI 응답 추출"""
    messages = state.get("messages", [])
    for msg in reversed(messages):
        if hasattr(msg, "type") and msg.type == "ai":
            if isinstance(msg.content, str):
                return msg.content
            return str(msg.content)
    return ""


def _format_citations(citations: list[dict[str, str]]) -> str:
    """출처를 마크다운 목록으로. 화면에 출처를 함께 보여준다."""
    if not citations:
        return ""
    lines = [f"- [{c['title']}]({c['url']})" for c in citations[:5]]
    return "\n\n*출처:*\n" + "\n".join(lines)


async def _grounding_search(query: str, system_prompt: str) -> tuple[str, str]:
    """웹 검색 호출. (본문, 출처 마크다운)을 돌려준다."""
    text, citations = await call_llm_grounded(
        system_prompt,
        query,
        timeout=GROUNDING_TIMEOUT,
        max_output_tokens=GROUNDING_MAX_TOKENS,
        temperature=0.5,
    )
    return text, _format_citations(citations)


async def grounding_node(state: AgentState) -> AgentState:
    """Grounding 노드: RAG 결과 부족 시 웹 검색으로 보강

    RAG 결과가 부족한 경우에만 호출됩니다.
    현재 AI 응답에 웹 검색 결과를 보강합니다.
    """
    if not state.get("needs_grounding", False):
        # Grounding 불필요 — 그냥 통과
        return {}

    user_message = _extract_last_user_message(state)
    existing_response = _get_last_ai_response(state)

    updates: dict = {
        "thinking": "최신 정보를 웹에서 검색 중...",
    }

    if not user_message:
        return updates

    system_prompt = GROUNDING_SYSTEM_PROMPT.format(query=user_message)

    grounding_result = ""
    sources = ""
    try:
        grounding_result, sources = await _grounding_search(user_message, system_prompt)
    except ProxyError as e:
        # 검색 실패는 치명적이지 않다. 기존 응답을 그대로 살린다.
        logger.warning(f"[Grounding] Web search failed: {e}")
    except asyncio.TimeoutError:
        logger.warning("[Grounding] Web search timed out")
    except Exception as e:
        logger.error(f"[Grounding] Unexpected error: {e}")

    if grounding_result and existing_response:
        # 기존 응답 + 웹 검색 보강 결합
        enhanced_response = (
            f"{existing_response}\n\n"
            f"---\n"
            f"*추가 참고 정보 (웹 검색):*\n{grounding_result}{sources}"
        )
        updates["messages"] = [AIMessage(content=enhanced_response)]
    elif grounding_result and not existing_response:
        updates["messages"] = [AIMessage(content=grounding_result + sources)]

    updates["thinking"] = ""
    updates["needs_grounding"] = False

    return updates
