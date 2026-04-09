"""RAG 검색 Tool 래퍼"""

import asyncio
import logging
from ...rag.retriever import RAGRetriever

logger = logging.getLogger(__name__)

_retriever: RAGRetriever | None = None


def _get_retriever() -> RAGRetriever:
    global _retriever
    if _retriever is None:
        _retriever = RAGRetriever()
    return _retriever


async def rewrite_query_with_history(
    query: str,
    conversation_history: list[dict] | None = None,
) -> str:
    """멀티턴 대화 맥락을 반영하여 자체 포함적 검색 쿼리로 재작성

    Args:
        query: 현재 사용자 쿼리
        conversation_history: 최근 대화 히스토리 (role/content 딕셔너리 리스트)

    Returns:
        재작성된 검색 쿼리
    """
    if not conversation_history or len(conversation_history) < 2:
        return query

    # 대화 히스토리가 충분히 짧으면 그냥 원본 사용
    lower_q = query.lower().strip()
    ambiguous_patterns = [
        "그것", "그거", "거기", "이것", "이거", "저것", "저거",
        "그", "이", "저", "더 알려", "자세히", "설명해",
        "what about", "tell me more", "elaborate", "more details",
    ]
    is_ambiguous = any(p in lower_q for p in ambiguous_patterns) or len(query) < 15

    if not is_ambiguous:
        return query

    try:
        from ...llm.factory import call_llm

        # 최근 5턴만 사용 (user + assistant 쌍)
        recent = conversation_history[-10:]
        history_text = "\n".join(
            f"{'사용자' if m.get('role') == 'user' else '에이전트'}: {str(m.get('content', ''))[:200]}"
            for m in recent
        )

        system_prompt = (
            "당신은 검색 쿼리 재작성 전문가입니다. "
            "대화 맥락을 분석하여 모호한 참조(그것, 이것 등)를 구체적인 명사로 대체하고, "
            "독립적으로 이해 가능한 검색 쿼리를 생성합니다. "
            "결과는 재작성된 쿼리 텍스트만 출력합니다. 설명 없이 쿼리만."
        )
        user_prompt = (
            f"대화 히스토리:\n{history_text}\n\n"
            f"현재 쿼리: {query}\n\n"
            "위 대화 맥락을 고려하여 자체 포함적(self-contained) 검색 쿼리로 재작성해주세요."
        )

        rewritten = await call_llm(
            model_name="flash",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            timeout=5.0,
            max_output_tokens=256,
            temperature=0.3,
        )
        rewritten = rewritten.strip().strip('"').strip("'")
        if rewritten:
            logger.info(f"[RAGTool] Query rewritten: '{query}' → '{rewritten}'")
            return rewritten
    except asyncio.TimeoutError:
        logger.warning(f"[RAGTool] Query rewrite timed out, using original query")
    except Exception as e:
        logger.warning(f"[RAGTool] Query rewrite failed: {e}")

    return query


async def rag_search(query: str, top_k: int = 5) -> list[dict]:
    """RAG 벡터 검색 수행

    Args:
        query: 검색 쿼리 텍스트
        top_k: 반환할 결과 수

    Returns:
        검색 결과 리스트 (content, source_type, section, similarity 등)
    """
    retriever = _get_retriever()
    try:
        results = await retriever.search(query, top_k=top_k)
        return results
    except Exception as e:
        # DB 연결 실패 등 — 빈 결과 반환
        print(f"[RAGTool] Search failed: {e}")
        return []


async def load_portfolio_catalog() -> list[dict]:
    """DB에서 포트폴리오 프로젝트 카탈로그(slug, title, description, techs, tags)를 조회"""
    try:
        from ...db.connection import get_pool
        pool = await get_pool()
        rows = await pool.fetch(
            "SELECT slug, title, description, technologies, tags FROM portfolio_projects ORDER BY sort_order, slug"
        )
        return [
            {
                "slug": row["slug"],
                "title": row["title"],
                "description": (row["description"] or "")[:80],
                "techs": list(row["technologies"]) if row["technologies"] else [],
                "tags": list(row["tags"]) if row["tags"] else [],
            }
            for row in rows
        ]
    except Exception as e:
        logger.warning(f"[RAGTool] Failed to load portfolio catalog: {e}")
        return []


def format_portfolio_catalog(catalog: list[dict]) -> str:
    """카탈로그를 프롬프트용 문자열로 포맷"""
    if not catalog:
        return "(조회 불가 — project-ref-card/project-table 사용 금지)"
    lines = []
    for p in catalog:
        techs = ", ".join(p["techs"][:5]) if p["techs"] else ""
        tags = ", ".join(p["tags"]) if p["tags"] else ""
        lines.append(f'- slug: {p["slug"]} | title: {p["title"]} | desc: {p["description"]} | techs: [{techs}] | tags: [{tags}]')
    return "\n".join(lines)


def format_rag_context(results: list[dict], max_chars: int = 3000) -> str:
    """RAG 결과를 프롬프트용 컨텍스트 문자열로 포맷

    Args:
        results: rag_search() 반환 결과
        max_chars: 최대 문자 수

    Returns:
        포맷된 컨텍스트 문자열
    """
    if not results:
        return "관련 정보를 찾지 못했습니다."

    context_parts = []
    total_chars = 0

    for i, result in enumerate(results):
        source_type = result.get("source_type", "unknown")
        section = result.get("section", "")
        content = result.get("content", "")
        similarity = result.get("similarity", 0.0)

        part = f"[문서 {i+1}] (출처: {source_type}, 섹션: {section}, 유사도: {similarity:.2f})\n{content}\n"

        if total_chars + len(part) > max_chars:
            break

        context_parts.append(part)
        total_chars += len(part)

    return "\n".join(context_parts)
