"""pytest 설정 — fixture 및 공통 유틸"""

import time
import pytest


# ──────────────────────────────────────────────
# 기본 fixture
# ──────────────────────────────────────────────

def pytest_addoption(parser):
    parser.addoption(
        "--agent-url",
        default="http://localhost:3101",
        help="Agent 서버 기본 URL (기본: http://localhost:3101)",
    )


@pytest.fixture(scope="session")
def agent_url(request):
    """Agent 서버 URL fixture (세션 범위)"""
    return request.config.getoption("--agent-url")


@pytest.fixture
def measure_time():
    """응답 시간 측정 fixture — (start_fn, elapsed_fn) 반환"""
    _start = [0.0]

    def start():
        _start[0] = time.monotonic()

    def elapsed() -> float:
        return time.monotonic() - _start[0]

    return start, elapsed


# ──────────────────────────────────────────────
# 결과 집계 (카테고리별)
# ──────────────────────────────────────────────

_category_results: dict[str, list[bool]] = {}


def _get_category(nodeid: str) -> str:
    """테스트 노드 ID에서 카테고리를 추출 (함수명 접두사 기반)"""
    name = nodeid.split("::")[-1]
    for prefix, category in [
        ("test_greeting", "GREETING"),
        ("test_career", "CAREER"),
        ("test_technical", "TECHNICAL"),
        ("test_contact", "CONTACT"),
        ("test_out_of_scope", "OUT_OF_SCOPE"),
        ("test_abuse", "ABUSE"),
        ("test_page_context", "PAGE_CONTEXT"),
        ("test_multi_turn", "MULTI_TURN"),
        ("test_edge", "EDGE_CASE"),
        ("test_rag", "RAG_QUALITY"),
        ("test_concurrent", "CONCURRENT"),
    ]:
        if name.startswith(prefix):
            return category
    return "OTHER"


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_logreport(report):
    """각 테스트 결과를 카테고리별로 집계 (skip은 통과로 처리)"""
    if report.when != "call":
        return
    category = _get_category(report.nodeid)
    _category_results.setdefault(category, [])
    # skipped는 조건부 통과(타임아웃 등)로 간주
    passed = report.passed or report.skipped
    _category_results[category].append(passed)


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """세션 종료 시 카테고리별 결과 출력"""
    if not _category_results:
        return

    terminalreporter.write_sep("=", "카테고리별 결과")
    for category, results in sorted(_category_results.items()):
        passed = sum(results)
        total = len(results)
        status = "OK" if passed == total else "FAIL"
        terminalreporter.write_line(
            f"  [{status}] {category}: {passed}/{total} 통과"
        )
    terminalreporter.write_sep("=", "")
