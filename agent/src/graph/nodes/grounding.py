"""Grounding 노드: Gemini Web Search 폴백"""

import asyncio
import logging

from langchain_core.messages import AIMessage
from google import genai
from google.genai import types as genai_types

from ...config import settings
from ...llm.factory import FLASH_MODEL
from ...llm.prompts import GROUNDING_SYSTEM_PROMPT
from ..state import AgentState

logger = logging.getLogger(__name__)


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


def _sync_grounding_search(query: str, system_prompt: str) -> str:
    """Gemini Web Search (Grounding) 동기 호출"""
    client = genai.Client(api_key=settings.gemini_api_key)

    try:
        response = client.models.generate_content(
            model=FLASH_MODEL,
            contents=query,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=[genai_types.Tool(google_search=genai_types.GoogleSearch())],
                temperature=0.5,
                max_output_tokens=1024,
            ),
        )
        return response.text or ""
    except Exception as e:
        logger.error(f"[Grounding] Web search failed: {e}")
        return ""


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

    # 웹 검색 실행 (executor 사용)
    loop = asyncio.get_event_loop()
    try:
        grounding_result = await asyncio.wait_for(
            loop.run_in_executor(
                None, _sync_grounding_search, user_message, system_prompt
            ),
            timeout=20.0,
        )
    except asyncio.TimeoutError:
        logger.warning("[Grounding] Web search timed out")
        grounding_result = ""
    except Exception as e:
        logger.error(f"[Grounding] Unexpected error: {e}")
        grounding_result = ""

    if grounding_result and existing_response:
        # 기존 응답 + 웹 검색 보강 결합
        enhanced_response = (
            f"{existing_response}\n\n"
            f"---\n"
            f"*추가 참고 정보 (웹 검색):*\n{grounding_result}"
        )
        updates["messages"] = [AIMessage(content=enhanced_response)]
    elif grounding_result and not existing_response:
        updates["messages"] = [AIMessage(content=grounding_result)]

    updates["thinking"] = ""
    updates["needs_grounding"] = False

    return updates
