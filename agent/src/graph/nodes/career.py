"""Career 노드: 경력 관련 질문 응답"""

import logging

from langchain_core.messages import AIMessage

from ...llm.factory import call_llm
from ...llm.prompts import CAREER_SYSTEM_PROMPT, POST_SUGGESTION_PROMPT
from ..tools.rag_tool import rag_search, format_rag_context
from ..state import AgentState

logger = logging.getLogger(__name__)

# RAG 결과가 부족한 기준 (similarity 기준)
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
        parts.append(f"{role}: {content[:200]}")  # 각 메시지 200자 제한

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


def _build_rag_query(user_message: str, conversation_context: str) -> str:
    """멀티턴 맥락을 반영한 RAG 쿼리 생성"""
    # 이전 대화가 있으면 맥락을 포함
    if "첫 번째 질문" not in conversation_context and len(conversation_context) > 20:
        # 최근 대화 맥락 + 현재 쿼리 결합
        return f"{conversation_context[-200:]}\n현재 질문: {user_message}"
    return user_message


async def career_node(state: AgentState) -> AgentState:
    """Career 노드: 경력 질문 응답 생성

    1. RAG 검색
    2. 컨텍스트 조합 + 프롬프트 작성
    3. Gemini Pro/Flash 호출
    4. Post-suggestion 생성 + 응답에 삽입
    5. needs_grounding 판정
    """
    user_message = _extract_last_user_message(state)
    conversation_context = _build_conversation_context(state)
    model_choice = state.get("model_choice", "flash")

    updates: dict = {
        "thinking": "관련 경력 정보를 검색 중...",
        "needs_grounding": False,
    }

    # 1. RAG 검색
    rag_query = _build_rag_query(user_message, conversation_context)
    rag_results = await rag_search(rag_query, top_k=6)
    updates["rag_results"] = rag_results

    # RAG 충분도 판정
    good_results = [r for r in rag_results if r.get("similarity", 0) >= RAG_MIN_SIMILARITY]
    if len(good_results) < RAG_MIN_RESULTS:
        updates["needs_grounding"] = True
        logger.info(f"[Career] RAG insufficient: {len(good_results)} good results")

    updates["thinking"] = f"{len(rag_results)}건의 관련 문서를 분석 중..."

    # 2. 컨텍스트 구성
    rag_context = format_rag_context(rag_results)
    system_prompt = CAREER_SYSTEM_PROMPT.format(
        rag_context=rag_context,
        conversation_context=conversation_context,
    )

    updates["thinking"] = "답변을 구성 중..."

    # 3. LLM 호출
    try:
        response_text = await call_llm(
            model_name=model_choice,
            system_prompt=system_prompt,
            user_prompt=user_message,
        )
    except Exception as e:
        logger.error(f"[Career] LLM call failed: {e}")
        response_text = "죄송합니다. 잠시 후 다시 시도해주세요."

    # 4. Post-suggestion 생성
    try:
        suggestion = await call_llm(
            model_name="flash",
            system_prompt="당신은 자연스러운 대화 연결 전문가입니다.",
            user_prompt=POST_SUGGESTION_PROMPT.format(
                current_response=response_text,
                conversation_context=conversation_context,
            ),
        )
        suggestion = suggestion.strip()
        if suggestion and not response_text.endswith(suggestion):
            # 응답에 자연스럽게 후속 제안 삽입
            response_text = f"{response_text}\n\n{suggestion}"
    except Exception as e:
        logger.warning(f"[Career] Post-suggestion failed: {e}")

    updates["thinking"] = ""
    updates["messages"] = [AIMessage(content=response_text)]

    return updates
