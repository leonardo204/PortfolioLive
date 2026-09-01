"""OpenAI 형식 tools 스키마 및 tool 함수 매핑

AI 프록시는 OpenAI 형식(messages + tools)을 그대로 상류에 전달한다.
"""

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


PORTFOLIO_TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "search_portfolio_projects",
            "description": (
                "포트폴리오 프로젝트를 태그로 검색합니다. 개인/회사/AI/iOS 등 다양한 기준으로 "
                "필터링 가능. '최근/최신 프로젝트' 질문이면 sort='recent'로 호출하세요."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "필터할 태그 목록. 예: ['side-project'], ['ai-ml', 'python'], ['work-b2b']. "
                            "태그 종류: side-project, work-b2b, work-internal / "
                            "web, ios, android, desktop, embedded, cloud, watch, tv / "
                            "c, cpp, java, python, swift, typescript, javascript, csharp, rust / "
                            "ai-ml, voice-stt-tts, stb-middleware, devtools, media, productivity. "
                            "특수 태그 'live': 현재 운영 중인 실서비스"
                        ),
                    },
                    "limit": {
                        "type": "integer",
                        "description": "반환할 최대 프로젝트 수 (기본 10)",
                    },
                    "sort": {
                        "type": "string",
                        "enum": ["default", "recent"],
                        "description": (
                            "정렬 기준. 'recent'=최신 연도순(year 내림차순) — "
                            "'최근/최신/요즘 프로젝트' 질문 시 반드시 사용. "
                            "'default'=큐레이션 순서(기본)."
                        ),
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_project_detail",
            "description": "특정 포트폴리오 프로젝트의 상세 정보를 가져옵니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "slug": {
                        "type": "string",
                        "description": "프로젝트 slug (예: dotclaude, mytammi)",
                    },
                },
                "required": ["slug"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_career_history",
            "description": (
                "경력과 업무 프로젝트를 키워드로 검색합니다. "
                "회사명, 기술, 프로젝트명 등으로 검색 가능."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "검색 키워드 (예: 'AI', '알티캐스트', 'STB', '2022')",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_career_summary",
            "description": "전체 경력 타임라인 간략 요약을 가져옵니다. 회사명, 기간, 역할만 포함된 개요.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "rag_search",
            "description": (
                "포트폴리오 문서를 벡터 유사도로 검색합니다. "
                "구체적인 기술 질문이나 프로젝트 세부사항 검색에 유용."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "검색 쿼리"},
                    "top_k": {"type": "integer", "description": "반환할 결과 수 (기본 5)"},
                },
                "required": ["query"],
            },
        },
    },
]

# tool 이름 → async callable 매핑
TOOL_FUNCTIONS: dict = {
    "search_portfolio_projects": search_portfolio_projects,
    "get_project_detail": get_project_detail,
    "search_career_history": search_career_history,
    "get_career_summary": get_career_summary,
    "rag_search": rag_search_tool,
}
