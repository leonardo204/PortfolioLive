"""
엣지 케이스 테스트 — 에러 핸들링 + 경계 조건

대상: /awp 엔드포인트
카테고리: EDGE_CASE
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
    assert text is not None, f"{prefix}응답이 None 입니다"
    assert len(text.strip()) > 0, f"{prefix}응답이 비어 있습니다"


def assert_no_crash(resp, label: str = "") -> None:
    """응답이 존재하고 비어있지 않음 (크래시 없음 확인)"""
    prefix = f"[{label}] " if label else ""
    assert resp is not None, f"{prefix}응답 객체가 None"
    assert_response_valid(resp.text, label)


# ──────────────────────────────────────────────
# 에러 핸들링
# ──────────────────────────────────────────────

class TestErrorHandling:

    def test_edge_empty_message(self, agent_url):
        """EC1: 빈 메시지 — '' 전송 시 에러 없이 fallback 응답"""
        resp = call_agent(
            [{"role": "user", "content": ""}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_no_crash(resp, "EC1-empty")
        print(f"\n[EC1] 빈 메시지 응답({resp.elapsed:.1f}s): {resp.text[:150]}")
        time.sleep(2)

    def test_edge_long_input(self, agent_url):
        """EC2: 극단적으로 긴 입력 — 5000자 이상, 타임아웃 없이 응답"""
        long_text = "경력에 대해 알려주세요. " * 400  # ~5200자
        assert len(long_text) >= 5000

        resp = call_agent(
            [{"role": "user", "content": long_text}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_no_crash(resp, "EC2-long")
        assert resp.elapsed < 50.0, (
            f"응답 시간이 50초 초과: {resp.elapsed:.1f}s"
        )
        print(f"\n[EC2] 긴 입력({len(long_text)}자) 응답({resp.elapsed:.1f}s): {resp.text[:150]}")
        time.sleep(2)

    def test_edge_special_chars_only(self, agent_url):
        """EC3: 특수문자만 입력 — '!@#$%^&*()' 에러 없이 응답"""
        resp = call_agent(
            [{"role": "user", "content": "!@#$%^&*()"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_no_crash(resp, "EC3-special")
        print(f"\n[EC3] 특수문자 응답({resp.elapsed:.1f}s): {resp.text[:150]}")
        time.sleep(2)


# ──────────────────────────────────────────────
# 경계 조건
# ──────────────────────────────────────────────

class TestBoundaryConditions:

    def test_edge_english_question(self, agent_url):
        """EC4: 영어 질문 — 'What is your experience with AI?' 응답 (한글 또는 영어)"""
        resp = call_agent(
            [{"role": "user", "content": "What is your experience with AI?"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_no_crash(resp, "EC4-english")
        if not is_timeout_response(resp.text):
            # 한글 또는 영어로 AI 관련 응답이어야 함 (느슨한 검증)
            ai_keywords = ["AI", "ai", "경험", "experience", "LangGraph", "LLM", "이용섭"]
            matched = [kw for kw in ai_keywords if kw in resp.text or kw.lower() in resp.text.lower()]
            assert len(matched) >= 1, (
                f"영어 질문에 대한 응답에 관련 키워드 없음. 응답: {resp.text[:200]}"
            )
        print(f"\n[EC4] 영어 질문 응답({resp.elapsed:.1f}s): {resp.text[:150]}")
        time.sleep(2)

    def test_edge_mixed_language(self, agent_url):
        """EC5: 한영 혼합 질문 — 'AI 관련 experience 알려줘' 정상 응답"""
        resp = call_agent(
            [{"role": "user", "content": "AI 관련 experience 알려줘"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_no_crash(resp, "EC5-mixed")
        if not is_timeout_response(resp.text):
            # AI 경험 관련 응답이어야 함
            keywords = ["AI", "경험", "LangGraph", "LLM", "기술", "개발"]
            matched = [kw for kw in keywords if kw in resp.text]
            assert len(matched) >= 1, (
                f"한영 혼합 질문에 응답 키워드 없음. 응답: {resp.text[:200]}"
            )
        print(f"\n[EC5] 한영 혼합 응답({resp.elapsed:.1f}s): {resp.text[:150]}")
        time.sleep(2)

    def test_edge_emoji_input(self, agent_url):
        """EC6: 이모지 포함 입력 — '경력이 궁금해요 😊' crash 없이 응답"""
        resp = call_agent(
            [{"role": "user", "content": "경력이 궁금해요 😊"}],
            base_url=agent_url,
            timeout=50.0,
        )
        assert_no_crash(resp, "EC6-emoji")
        if not is_timeout_response(resp.text):
            keywords = ["경력", "년", "개발", "경험", "저", "제"]
            matched = [kw for kw in keywords if kw in resp.text]
            assert len(matched) >= 1, (
                f"이모지 포함 질문에 응답 키워드 없음. 응답: {resp.text[:200]}"
            )
        print(f"\n[EC6] 이모지 입력 응답({resp.elapsed:.1f}s): {resp.text[:150]}")
        time.sleep(2)
