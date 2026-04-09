"""Gemini FunctionDeclaration 스키마 및 tool 함수 매핑"""

from google.genai import types as genai_types

from ..graph.tools.career_tools import search_career_history, get_career_summary
from ..graph.tools.portfolio_tools import search_portfolio_projects, get_project_detail
from ..graph.tools.rag_tool import rag_search as _rag_search_raw, format_rag_context


async def rag_search_tool(query: str, top_k: int = 5) -> str:
    """RAG 벡터 유사도 검색 — 포트폴리오 문서에서 관련 정보를 검색하여 텍스트로 반환.

    Args:
        query: 검색 쿼리
        top_k: 반환할 결과 수 (기본 5)

    Returns:
        검색 결과 마크다운 텍스트
    """
    results = await _rag_search_raw(query, top_k=top_k)
    return format_rag_context(results)


PORTFOLIO_TOOLS = genai_types.Tool(
    function_declarations=[
        genai_types.FunctionDeclaration(
            name="search_portfolio_projects",
            description="포트폴리오 프로젝트를 태그로 검색합니다. 개인/회사/AI/iOS 등 다양한 기준으로 필터링 가능.",
            parameters=genai_types.Schema(
                type=genai_types.Type.OBJECT,
                properties={
                    "tags": genai_types.Schema(
                        type=genai_types.Type.ARRAY,
                        items=genai_types.Schema(type=genai_types.Type.STRING),
                        description=(
                            "필터할 태그 목록. 예: ['side-project'], ['ai-ml', 'python'], ['work-b2b']. "
                            "태그 종류: side-project, work-b2b, work-internal / "
                            "web, ios, android, desktop, embedded, cloud, watch, tv / "
                            "c, cpp, java, python, swift, typescript, javascript, csharp, rust / "
                            "ai-ml, voice-stt-tts, stb-middleware, devtools, media, productivity"
                        ),
                    ),
                    "limit": genai_types.Schema(
                        type=genai_types.Type.INTEGER,
                        description="반환할 최대 프로젝트 수 (기본 10)",
                    ),
                },
            ),
        ),
        genai_types.FunctionDeclaration(
            name="get_project_detail",
            description="특정 포트폴리오 프로젝트의 상세 정보를 가져옵니다.",
            parameters=genai_types.Schema(
                type=genai_types.Type.OBJECT,
                properties={
                    "slug": genai_types.Schema(
                        type=genai_types.Type.STRING,
                        description="프로젝트 slug (예: dotclaude, mytammi)",
                    ),
                },
                required=["slug"],
            ),
        ),
        genai_types.FunctionDeclaration(
            name="search_career_history",
            description="경력과 업무 프로젝트를 키워드로 검색합니다. 회사명, 기술, 프로젝트명 등으로 검색 가능.",
            parameters=genai_types.Schema(
                type=genai_types.Type.OBJECT,
                properties={
                    "query": genai_types.Schema(
                        type=genai_types.Type.STRING,
                        description="검색 키워드 (예: 'AI', '알티캐스트', 'STB', '2022')",
                    ),
                },
                required=["query"],
            ),
        ),
        genai_types.FunctionDeclaration(
            name="get_career_summary",
            description="전체 경력 타임라인 간략 요약을 가져옵니다. 회사명, 기간, 역할만 포함된 개요.",
            parameters=genai_types.Schema(
                type=genai_types.Type.OBJECT,
                properties={},
            ),
        ),
        genai_types.FunctionDeclaration(
            name="rag_search",
            description="포트폴리오 문서를 벡터 유사도로 검색합니다. 구체적인 기술 질문이나 프로젝트 세부사항 검색에 유용.",
            parameters=genai_types.Schema(
                type=genai_types.Type.OBJECT,
                properties={
                    "query": genai_types.Schema(
                        type=genai_types.Type.STRING,
                        description="검색 쿼리",
                    ),
                    "top_k": genai_types.Schema(
                        type=genai_types.Type.INTEGER,
                        description="반환할 결과 수 (기본 5)",
                    ),
                },
                required=["query"],
            ),
        ),
    ]
)

# tool 이름 → async callable 매핑
TOOL_FUNCTIONS: dict = {
    "search_portfolio_projects": search_portfolio_projects,
    "get_project_detail": get_project_detail,
    "search_career_history": search_career_history,
    "get_career_summary": get_career_summary,
    "rag_search": rag_search_tool,
}
