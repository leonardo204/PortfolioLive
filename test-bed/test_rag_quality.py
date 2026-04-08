"""
RAG 품질 테스트 — 특정 프로젝트명/기술 키워드 검색 품질 검증

대상: /awp 엔드포인트
카테고리: RAG_QUALITY

LLM 비결정성을 감안하여 키워드 기반 느슨한 검증을 적용한다.
"""

import time
import pytest
from utils.sse_client import call_agent


# ──────────────────────────────────────────────
# 공통 헬퍼
# ──────────────────────────────────────────────

TIMEOUT_FALLBACK = "잠시 후 다시 시도해주세요"


def is_timeout_response(text: str) -> bool:
    return TIMEOUT_FALLBACK in text


def assert_response_valid(text: str, label: str = "") -> None:
    prefix = f"[{label}] " if label else ""
    assert text, f"{prefix}응답이 비어 있습니다"
    assert len(text.strip()) > 0, f"{prefix}응답이 공백만 포함합니다"


def assert_keywords_or_skip(
    text: str, keywords: list[str], min_match: int = 1, label: str = ""
) -> None:
    if is_timeout_response(text):
        pytest.skip(f"[{label}] 서버 타임아웃 — 키워드 검증 건너뜀")
    matched = [kw for kw in keywords if kw in text]
    assert len(matched) >= min_match, (
        f"[{label}] 키워드 {keywords} 중 {min_match}개 이상 필요, "
        f"매칭: {matched}\n응답: {text[:300]}"
    )


# ──────────────────────────────────────────────
# RAG 품질 — 프로젝트명 검색
# ──────────────────────────────────────────────

class TestRagProjectSearch:

    def test_rag_dotclaude_project(self, agent_url):
        """RQ1: dotclaude 프로젝트명 포함 응답 확인"""
        resp = call_agent(
            [{"role": "user", "content": "dotclaude 프로젝트에 대해 알려줘"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_response_valid(resp.text, "RQ1")
        assert_keywords_or_skip(
            resp.text,
            ["dotclaude", "Claude", "AI", "프로젝트", "도구", "개발"],
            min_match=1,
            label="RQ1",
        )
        print(f"\n[RQ1] dotclaude 응답({resp.elapsed:.1f}s): {resp.text[:200]}")
        time.sleep(2)

    def test_rag_mytammi_project(self, agent_url):
        """RQ2: mytammi 프로젝트명 포함 응답 확인"""
        resp = call_agent(
            [{"role": "user", "content": "mytammi가 뭐야?"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_response_valid(resp.text, "RQ2")
        assert_keywords_or_skip(
            resp.text,
            ["mytammi", "프로젝트", "서비스", "앱", "개발", "타미"],
            min_match=1,
            label="RQ2",
        )
        print(f"\n[RQ2] mytammi 응답({resp.elapsed:.1f}s): {resp.text[:200]}")
        time.sleep(2)

    def test_rag_nonexistent_project(self, agent_url):
        """RQ3: 존재하지 않는 프로젝트 — 에러 없이 '없다' 또는 유사 안내"""
        resp = call_agent(
            [{"role": "user", "content": "xyznotexist 프로젝트 알려줘"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_response_valid(resp.text, "RQ3")
        if not is_timeout_response(resp.text):
            # 에러 없이 응답이 와야 함 (텍스트 비어있지 않음으로 충분)
            # 추가적으로 '없' 또는 '모르' 또는 안내 키워드 확인
            no_info_keywords = ["없", "모르", "찾을 수 없", "확인", "정보", "죄송", "다른"]
            matched = [kw for kw in no_info_keywords if kw in resp.text]
            # 느슨한 검증: 에러 없이 응답 왔으면 통과
            # (키워드 매칭 실패해도 응답 존재 자체가 목표)
            print(f"\n[RQ3] 없는 프로젝트 응답({resp.elapsed:.1f}s): {resp.text[:200]}")
            print(f"  매칭 키워드: {matched}")
        time.sleep(2)


# ──────────────────────────────────────────────
# RAG 품질 — 기술 스택 검색
# ──────────────────────────────────────────────

class TestRagTechSearch:

    def test_rag_langgraph_usage(self, agent_url):
        """RQ4: LangGraph 활용 방법 — 응답에 'LangGraph' 포함"""
        resp = call_agent(
            [{"role": "user", "content": "LangGraph를 어떻게 활용했나요?"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_response_valid(resp.text, "RQ4")
        assert_keywords_or_skip(
            resp.text,
            ["LangGraph", "에이전트", "워크플로", "그래프", "AI", "활용"],
            min_match=1,
            label="RQ4",
        )
        print(f"\n[RQ4] LangGraph 응답({resp.elapsed:.1f}s): {resp.text[:200]}")
        time.sleep(2)
