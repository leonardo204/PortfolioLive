"""Technical 노드: 기술 관련 질문 응답"""

import logging
import re

from langchain_core.messages import AIMessage

from ...llm.factory import call_llm, user_message_for
from ...llm.prompts import TECHNICAL_SYSTEM_PROMPT
from ...llm.tools_schema import PORTFOLIO_TOOLS, TOOL_FUNCTIONS
from ...config import settings
from ..tools.rag_tool import rag_search_scored, format_rag_context, rewrite_query_with_history
from ..state import AgentState

logger = logging.getLogger(__name__)

# 충분도 기준은 설정에서 읽는다. 질의를 임베딩한 모델에 따라 값이 달라지므로
# 검색 결과와 함께 돌려받는다.

# "최근/최신" 류 질문 감지 — LLM이 sort='recent'를 놓쳐도 강제하는 결정적 안전망
RECENT_PATTERN = re.compile(r"최근|최신|요즘|근래|latest|recent", re.IGNORECASE)

# 본인 신상을 묻는 질문 — 웹 검색으로 보강하면 안 되는 영역.
# 검색 결과에 섞인 동명이인이나 남의 이력을 1인칭으로 옮겨 적는 사고가 실제로 났다.
# 의도가 TECHNICAL로 분류돼도 내용이 신상이면 웹 검색을 끈다.
PERSONAL_PATTERN = re.compile(
    r"소속|직급|직책|재직|회사|팀|연봉|나이|학력|전공|출신|연락처|이메일|메일|전화|"
    r"현재\s*하는|어디서\s*일|position|company|contact|email|salary",
    re.IGNORECASE,
)


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
    3. LLM 호출(AI 프록시 경유) — Tool calling으로 경력/포트폴리오 데이터 on-demand 조회
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
    rag_results, min_similarity = await rag_search_scored(rag_query, top_k=6)
    updates["rag_results"] = rag_results

    # RAG 충분도 판정
    good_results = [r for r in rag_results if r.get("similarity", 0) >= min_similarity]
    if len(good_results) < settings.rag_min_results:
        if PERSONAL_PATTERN.search(user_message):
            logger.info(
                f"[Technical] RAG 결과 부족({len(good_results)}건)이지만 신상 질문이라 "
                f"웹 검색 보강을 건너뜁니다."
            )
        else:
            updates["needs_grounding"] = True
            logger.info(
                f"[Technical] RAG 결과 부족 — 기준 {min_similarity:.2f} 이상 {len(good_results)}건, "
                f"웹 검색으로 보강합니다."
            )

    updates["thinking"] = f"{len(rag_results)}건의 관련 기술 문서를 분석 중..."

    # 2. 프롬프트 작성 (RAG 컨텍스트 + 대화 히스토리만 주입)
    rag_context = format_rag_context(rag_results)
    system_prompt = TECHNICAL_SYSTEM_PROMPT.format(
        rag_context=rag_context,
        conversation_context=conversation_context,
    )

    # 안전망: "최근/최신" 질문이면 recency 정렬을 강제 (LLM이 sort 파라미터를 놓쳐도 보장)
    if RECENT_PATTERN.search(user_message):
        system_prompt += (
            "\n\n[중요 힌트] 사용자가 '최근/최신' 프로젝트를 묻고 있습니다. "
            "반드시 search_portfolio_projects를 sort='recent'로 호출하여 연도 내림차순으로 조회하고, "
            "가장 최신(2026년 등) 프로젝트부터 상위 3~5개를 연도와 함께 제시하세요."
        )
        logger.info("[Technical] recency 질문 감지 → sort='recent' 힌트 주입")

    updates["thinking"] = "기술 답변을 구성 중..."

    # 3. LLM 호출 — Tool calling으로 경력/포트폴리오 데이터 on-demand 조회
    try:
        response_text = await call_llm(
            model_name=model_choice,
            system_prompt=system_prompt,
            user_prompt=user_message,
            max_output_tokens=4096,
            tools=PORTFOLIO_TOOLS,
            tool_functions=TOOL_FUNCTIONS,
            screen="technical",
        )
    except Exception as e:
        logger.error(f"[Technical] LLM call failed: {e}")
        response_text = user_message_for(e)

    if not response_text:
        response_text = "죄송합니다. 잠시 후 다시 시도해주세요."

    updates["thinking"] = ""
    updates["messages"] = [AIMessage(content=response_text)]

    return updates
