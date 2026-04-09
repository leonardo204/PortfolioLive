"""Technical 노드: 기술 관련 질문 응답"""

import logging

from langchain_core.messages import AIMessage

from ...llm.factory import call_llm
from ...llm.prompts import TECHNICAL_SYSTEM_PROMPT
from ...llm.tools_schema import PORTFOLIO_TOOLS, TOOL_FUNCTIONS
from ..tools.rag_tool import rag_search, format_rag_context, rewrite_query_with_history
from ..state import AgentState

logger = logging.getLogger(__name__)

RAG_MIN_RESULTS = 2
RAG_MIN_SIMILARITY = 0.5


def _build_conversation_context(state: AgentState, last_n: int = 5) -> str:
    """최근 대화 히스토리를 문자열로 변환"""
    messages = state.get("messages", [])
    recent = messages[-last_n * 2:] if len(messages) > last_n * 2 else messages

    parts = []
    for msg in recent:
        if not hasattr(msg, "type"):
            continue
        role = "사용자" if msg.type == "human" else "에이전트"
        content = msg.content if isinstance(msg.content, str) else str(msg.content)
        parts.append(f"{role}: {content[:200]}")

    return "\n".join(parts) if parts else "첫 번째 질문입니다."


def _extract_last_user_message(state: AgentState) -> str:
    """마지막 사용자 메시지 추출"""
    messages = state.get("messages", [])
    for msg in reversed(messages):
        if hasattr(msg, "type") and msg.type == "human":
            if isinstance(msg.content, str):
                return msg.content
            return str(msg.content)
    return ""


def _build_conversation_history_for_rewrite(state: AgentState) -> list[dict]:
    """대화 히스토리를 role/content 딕셔너리 형태로 변환 (쿼리 재작성용)"""
    messages = state.get("messages", [])
    result = []
    for msg in messages:
        if not hasattr(msg, "type"):
            continue
        role = "user" if msg.type == "human" else "assistant"
        content = msg.content if isinstance(msg.content, str) else str(msg.content)
        result.append({"role": role, "content": content[:300]})
    return result


async def technical_node(state: AgentState) -> AgentState:
    """Technical 노드: 기술 질문 응답 생성

    1. RAG 검색 (사전 검색)
    2. 프롬프트 작성 (RAG 컨텍스트 + 대화 히스토리)
    3. Gemini 호출 — Tool calling으로 경력/포트폴리오 데이터 on-demand 조회
    4. needs_grounding 판정
    """
    user_message = _extract_last_user_message(state)
    conversation_context = _build_conversation_context(state)
    model_choice = state.get("model_choice", "pro")

    updates: dict = {
        "thinking": "관련 기술 정보를 검색 중...",
        "needs_grounding": False,
    }

    # 1. 멀티턴 쿼리 재작성 후 RAG 검색 (사전 검색 유지)
    history_for_rewrite = _build_conversation_history_for_rewrite(state)
    rag_query = await rewrite_query_with_history(user_message, history_for_rewrite)
    rag_results = await rag_search(rag_query, top_k=6)
    updates["rag_results"] = rag_results

    # RAG 충분도 판정
    good_results = [r for r in rag_results if r.get("similarity", 0) >= RAG_MIN_SIMILARITY]
    if len(good_results) < RAG_MIN_RESULTS:
        updates["needs_grounding"] = True
        logger.info(f"[Technical] RAG insufficient: {len(good_results)} good results")

    updates["thinking"] = f"{len(rag_results)}건의 관련 기술 문서를 분석 중..."

    # 2. 프롬프트 작성 (RAG 컨텍스트 + 대화 히스토리만 주입)
    rag_context = format_rag_context(rag_results)
    system_prompt = TECHNICAL_SYSTEM_PROMPT.format(
        rag_context=rag_context,
        conversation_context=conversation_context,
    )

    updates["thinking"] = "기술 답변을 구성 중..."

    # 3. LLM 호출 — Tool calling으로 경력/포트폴리오 데이터 on-demand 조회
    try:
        response_text = await call_llm(
            model_name=model_choice,
            system_prompt=system_prompt,
            user_prompt=user_message,
            max_output_tokens=4096,
            tools=[PORTFOLIO_TOOLS],
            tool_functions=TOOL_FUNCTIONS,
        )
    except Exception as e:
        logger.error(f"[Technical] LLM call failed: {e}")
        response_text = "죄송합니다. 잠시 후 다시 시도해주세요."

    if not response_text:
        response_text = "죄송합니다. 잠시 후 다시 시도해주세요."

    updates["thinking"] = ""
    updates["messages"] = [AIMessage(content=response_text)]

    return updates
