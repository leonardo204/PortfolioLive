"""Live Services 기능 테스트

테스트 범위:
- tools_schema.py: search_portfolio_projects 스키마 구조 검증 (DB 불필요)
- portfolio_tools.py: live 태그 SQL 쿼리 로직 검증 (sys.modules mock)
- Admin liveUrl/tags 로직: 순수 Python 검증

실행 방법:
    # uv 환경 (Docker 내부 또는 uv 설치 시)
    cd agent && uv run pytest tests/test_live_services.py -v

    # 시스템 Python (asyncpg/google-genai 미설치 시 — Schema 클래스는 자동 SKIP)
    cd agent && python3 -m pytest tests/test_live_services.py -v

    # Docker 내부 전체 실행
    docker-compose exec agent uv run pytest tests/test_live_services.py -v

참고:
    - TestSearchPortfolioProjectsSchema: google-genai 패키지 필요 (미설치 시 SKIP)
    - TestSearchPortfolioProjectsLiveFilter: sys.modules mock으로 asyncpg 없이 실행 가능
    - TestLiveUrlSanitize: 순수 Python 로직, 의존성 없음
"""

import asyncio
import sys
import types
import pytest
from unittest.mock import AsyncMock, MagicMock


# ---------------------------------------------------------------------------
# 헬퍼
# ---------------------------------------------------------------------------

def run_async(coro):
    """pytest-asyncio 없이 async 코루틴을 실행하는 헬퍼"""
    return asyncio.run(coro)


def _make_mock_row(slug="test-project", title="Test", description="Desc",
                   technologies=None, tags=None):
    """asyncpg Record-like MagicMock 생성"""
    data = {
        "slug": slug,
        "title": title,
        "description": description,
        "technologies": technologies or [],
        "tags": tags or [],
    }
    row = MagicMock()
    row.__getitem__ = lambda self, key: data[key]
    return row


def _inject_mock_modules(pool_mock):
    """asyncpg, pydantic_settings, google.genai 등 미설치 패키지를 sys.modules에 mock 주입.

    portfolio_tools.py가 지연 임포트(`from ...db.connection import get_pool`)를 사용하므로
    db.connection 모듈 자체를 mock으로 교체한다.
    """
    # asyncpg mock
    asyncpg_mock = types.ModuleType("asyncpg")
    sys.modules.setdefault("asyncpg", asyncpg_mock)

    # pydantic_settings mock
    if "pydantic_settings" not in sys.modules:
        ps_mock = types.ModuleType("pydantic_settings")

        class BaseSettings:
            def __init__(self, **kwargs):
                pass

        class SettingsConfigDict(dict):
            pass

        ps_mock.BaseSettings = BaseSettings
        ps_mock.SettingsConfigDict = SettingsConfigDict
        sys.modules["pydantic_settings"] = ps_mock

    # src.config mock
    if "src.config" not in sys.modules:
        config_mock = types.ModuleType("src.config")

        class Settings:
            database_url = ""
            postgres_db = "portfoliolive"
            postgres_user = "portfoliolive"
            postgres_password = ""
            postgres_port = 5433
            effective_database_url = "postgresql://localhost/portfoliolive"

        config_mock.Settings = Settings
        config_mock.settings = Settings()
        sys.modules["src.config"] = config_mock

    # src.db.connection mock — get_pool이 pool_mock을 반환하는 AsyncMock
    conn_mock = types.ModuleType("src.db.connection")
    conn_mock.get_pool = AsyncMock(return_value=pool_mock)
    conn_mock.close_pool = AsyncMock()
    sys.modules["src.db.connection"] = conn_mock

    # src.db.__init__ mock
    db_mock = types.ModuleType("src.db")
    db_mock.get_pool = conn_mock.get_pool
    db_mock.close_pool = conn_mock.close_pool
    db_mock.connection = conn_mock
    sys.modules["src.db"] = db_mock

    return conn_mock


# ---------------------------------------------------------------------------
# 1. tools_schema.py 스키마 검증 (google-genai 필요)
# ---------------------------------------------------------------------------

class TestSearchPortfolioProjectsSchema:
    """search_portfolio_projects FunctionDeclaration 스키마 검증

    google-genai 패키지가 없으면 각 테스트가 자동 SKIP.
    """

    def _import_tools(self):
        pytest.importorskip("google.genai", reason="google-genai 패키지 미설치")
        from src.llm.tools_schema import PORTFOLIO_TOOLS, TOOL_FUNCTIONS
        return PORTFOLIO_TOOLS, TOOL_FUNCTIONS

    def test_search_portfolio_projects_declaration_exists(self):
        """search_portfolio_projects FunctionDeclaration이 PORTFOLIO_TOOLS에 등록되어 있어야 한다"""
        tools, _ = self._import_tools()
        names = [d.name for d in tools.function_declarations]
        assert "search_portfolio_projects" in names

    def test_tags_parameter_is_array_type(self):
        """tags 파라미터 타입은 ARRAY여야 한다"""
        tools, _ = self._import_tools()
        from google.genai import types as genai_types
        decl = next(d for d in tools.function_declarations if d.name == "search_portfolio_projects")
        tags_schema = decl.parameters.properties["tags"]
        assert tags_schema.type == genai_types.Type.ARRAY

    def test_limit_parameter_exists(self):
        """limit 파라미터가 스키마에 존재해야 한다"""
        tools, _ = self._import_tools()
        decl = next(d for d in tools.function_declarations if d.name == "search_portfolio_projects")
        assert "limit" in decl.parameters.properties

    def test_tool_function_mapping_exists(self):
        """TOOL_FUNCTIONS에 search_portfolio_projects callable이 매핑되어야 한다"""
        _, tool_functions = self._import_tools()
        assert "search_portfolio_projects" in tool_functions
        assert callable(tool_functions["search_portfolio_projects"])

    def test_description_mentions_tag_filtering(self):
        """description에 태그 필터링 관련 설명이 포함되어야 한다"""
        tools, _ = self._import_tools()
        decl = next(d for d in tools.function_declarations if d.name == "search_portfolio_projects")
        desc = decl.description or ""
        assert "태그" in desc or "tag" in desc.lower() or "필터" in desc


# ---------------------------------------------------------------------------
# 2. portfolio_tools.py — live 태그 필터 로직 (sys.modules mock)
# ---------------------------------------------------------------------------

class TestSearchPortfolioProjectsLiveFilter:
    """search_portfolio_projects 함수의 live 태그 필터 동작 검증

    sys.modules에 mock을 주입하여 asyncpg 없이 실행.
    """

    def _get_search_fn(self, pool_mock):
        """mock 주입 후 search_portfolio_projects 함수 반환"""
        _inject_mock_modules(pool_mock)
        # 모듈 캐시 제거 후 재임포트
        sys.modules.pop("src.graph.tools.portfolio_tools", None)
        from src.graph.tools.portfolio_tools import search_portfolio_projects
        return search_portfolio_projects

    def test_live_tag_filter_calls_fetch_with_tags_arg(self):
        """tags=["live"] 전달 시 pool.fetch 인자에 ["live"]가 포함되어야 한다"""
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(return_value=[])
        search_fn = self._get_search_fn(pool_mock)

        run_async(search_fn(tags=["live"]))

        call_args = pool_mock.fetch.call_args
        assert call_args is not None, "pool.fetch가 호출되지 않음"
        positional_args = call_args[0]
        assert ["live"] in positional_args, (
            f"tags=['live']가 fetch 호출 인자에 없음: {positional_args}"
        )

    def test_live_tag_result_contains_project_title(self):
        """live 태그 필터 결과에 프로젝트 제목이 포함되어야 한다"""
        live_row = _make_mock_row(
            slug="portfoliolive",
            title="PortfolioLive",
            description="포트폴리오 서비스",
            technologies=["Next.js", "FastAPI"],
            tags=["live", "side-project"],
        )
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(return_value=[live_row])
        search_fn = self._get_search_fn(pool_mock)

        result = run_async(search_fn(tags=["live"]))
        assert "PortfolioLive" in result
        assert "portfoliolive" in result

    def test_no_live_projects_returns_not_found_message(self):
        """live 태그 프로젝트가 없을 때 '찾지 못했습니다' 메시지를 반환해야 한다"""
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(return_value=[])
        search_fn = self._get_search_fn(pool_mock)

        result = run_async(search_fn(tags=["live"]))
        assert "찾지 못했습니다" in result or "없습니다" in result

    def test_live_tag_appears_in_result_output(self):
        """반환된 마크다운 출력에 'live' 문자열이 포함되어야 한다"""
        live_row = _make_mock_row(slug="myapp", title="My App", tags=["live"])
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(return_value=[live_row])
        search_fn = self._get_search_fn(pool_mock)

        result = run_async(search_fn(tags=["live"]))
        assert "live" in result

    def test_no_tags_returns_all_projects(self):
        """tags=None 시 전체 프로젝트 목록이 반환되어야 한다"""
        rows = [
            _make_mock_row(slug="proj-a", title="Proj A", tags=[]),
            _make_mock_row(slug="proj-b", title="Proj B", tags=["live"]),
        ]
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(return_value=rows)
        search_fn = self._get_search_fn(pool_mock)

        result = run_async(search_fn(tags=None))
        assert "Proj A" in result
        assert "Proj B" in result

    def test_db_error_returns_user_friendly_error_message(self):
        """DB 연결 오류 시 사용자 친화적 에러 메시지를 반환해야 한다"""
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(side_effect=Exception("DB connection failed"))
        search_fn = self._get_search_fn(pool_mock)

        result = run_async(search_fn(tags=["live"]))
        assert "오류" in result or "error" in result.lower()

    def test_limit_parameter_passed_to_fetch(self):
        """limit=3 파라미터가 pool.fetch 호출 인자에 전달되어야 한다"""
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(return_value=[])
        search_fn = self._get_search_fn(pool_mock)

        run_async(search_fn(tags=["live"], limit=3))

        call_args = pool_mock.fetch.call_args
        positional_args = call_args[0]
        assert 3 in positional_args, f"limit=3이 fetch 인자에 없음: {positional_args}"

    def test_multiple_live_projects_all_appear_in_result(self):
        """live 태그를 가진 복수의 프로젝트가 모두 결과에 포함되어야 한다"""
        rows = [
            _make_mock_row(slug="live-app-1", title="Live App 1", tags=["live"]),
            _make_mock_row(slug="live-app-2", title="Live App 2", tags=["live", "web"]),
        ]
        pool_mock = MagicMock()
        pool_mock.fetch = AsyncMock(return_value=rows)
        search_fn = self._get_search_fn(pool_mock)

        result = run_async(search_fn(tags=["live"]))
        assert "Live App 1" in result
        assert "Live App 2" in result


# ---------------------------------------------------------------------------
# 3. liveUrl sanitize + tags toggle 로직 (Admin 프론트엔드 계약 — 순수 Python)
# ---------------------------------------------------------------------------

class TestLiveUrlSanitize:
    """liveUrl 빈 문자열 → None 변환 및 tags 토글 로직 검증

    Admin 페이지 JavaScript 로직의 Python 등가 검증:
    - handleSave: `liveUrl: editLiveUrl || null`
    - handleSave: `baseTags.filter(t => t !== 'live').concat(isLive ? ['live'] : [])`
    """

    def test_empty_string_becomes_none(self):
        """빈 문자열 liveUrl은 None으로 변환되어야 한다"""
        edit_live_url = ""
        payload_live_url = edit_live_url or None
        assert payload_live_url is None

    def test_valid_url_is_preserved(self):
        """유효한 URL은 그대로 유지되어야 한다"""
        edit_live_url = "https://portfoliolive.example.com"
        payload_live_url = edit_live_url or None
        assert payload_live_url == "https://portfoliolive.example.com"

    def test_none_input_stays_none(self):
        """None 입력은 None 그대로 유지되어야 한다"""
        edit_live_url = None
        payload_live_url = edit_live_url or None
        assert payload_live_url is None

    def test_live_tag_toggle_adds_live_to_tags(self):
        """editIsLive=True 시 tags 배열에 'live'가 추가되어야 한다"""
        base_tags = ["side-project", "web"]
        edit_is_live = True
        new_tags = [t for t in base_tags if t != "live"]
        if edit_is_live:
            new_tags = new_tags + ["live"]
        assert "live" in new_tags
        assert new_tags.count("live") == 1

    def test_live_tag_toggle_removes_live_from_tags(self):
        """editIsLive=False 시 tags 배열에서 'live'가 제거되어야 한다"""
        base_tags = ["side-project", "live", "web"]
        edit_is_live = False
        new_tags = [t for t in base_tags if t != "live"]
        if edit_is_live:
            new_tags = new_tags + ["live"]
        assert "live" not in new_tags
        assert "side-project" in new_tags

    def test_live_tag_not_duplicated_when_already_present(self):
        """'live' 태그가 이미 있을 때 editIsLive=True 시 중복 추가되지 않아야 한다"""
        base_tags = ["live", "side-project"]
        edit_is_live = True
        new_tags = [t for t in base_tags if t != "live"]
        if edit_is_live:
            new_tags = new_tags + ["live"]
        assert new_tags.count("live") == 1

    def test_whitespace_liveurl_not_sanitized_by_current_logic(self):
        """공백 문자열 liveUrl은 현재 로직으로 sanitize되지 않음 — 개선 대상 문서화"""
        # JS: '   ' || null → '   ' (공백은 truthy)
        # 향후 개선: editLiveUrl.trim() || null 처리 필요
        edit_live_url = "   "
        payload_live_url = edit_live_url or None
        assert payload_live_url == "   "  # TODO: None이어야 함 (trim 미처리)
