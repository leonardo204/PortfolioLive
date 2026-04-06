"""RAG 검색 Tool 래퍼"""

from ...rag.retriever import RAGRetriever

_retriever: RAGRetriever | None = None


def _get_retriever() -> RAGRetriever:
    global _retriever
    if _retriever is None:
        _retriever = RAGRetriever()
    return _retriever


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
