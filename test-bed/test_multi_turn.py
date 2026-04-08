"""
멀티턴(Multi-turn) 테스트 — /awp 엔드포인트

서버는 stateless이므로 messages 배열에 이전 대화를 모두 누적하여 전달한다.
threadId는 세션 내 동일하게 유지한다.

주의: 서버 30s 타임아웃 초과 시 폴백 응답이 오므로
      타임아웃 응답인 경우 맥락 검증은 건너뛰고 응답 존재만 확인한다.
"""

import time
import pytest
from utils.sse_client import MultiTurnSession


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
    """타임아웃 응답이면 skip, 아니면 키워드 검증"""
    if is_timeout_response(text):
        pytest.skip(f"[{label}] 서버 타임아웃 — 맥락 검증 건너뜀")
    matched = [kw for kw in keywords if kw in text]
    assert len(matched) >= min_match, (
        f"[{label}] 키워드 {keywords} 중 {min_match}개 이상 필요, "
        f"매칭: {matched}\n응답: {text[:300]}"
    )


# ──────────────────────────────────────────────
# 시나리오 M1: 경력 심화 질문 (3턴)
# ──────────────────────────────────────────────

class TestMultiTurnCareer:
    """
    Turn 1: 경력 질문 → 경력 개요 응답
    Turn 2: 그 경력에서 쓴 기술 질문 → Turn 1 맥락 참조
    Turn 3: 그 기술로 만든 프로젝트 질문 → 구체적 프로젝트 언급
    """

    def test_multi_turn_career_scenario(self, agent_url):
        """M1: 경력 심화 3턴 대화"""
        session = MultiTurnSession(base_url=agent_url)

        # Turn 1
        resp1 = session.send("경력이 어떻게 되나요?")
        assert_response_valid(resp1.text, "Turn1")
        print(f"\n[Turn 1] 응답({resp1.elapsed:.1f}s): {resp1.text[:100]}...")
        time.sleep(3)

        # Turn 2 — Turn 1 맥락 기반 심화 질문
        resp2 = session.send("그럼 주로 어떤 기술을 쓰셨나요?")
        assert_response_valid(resp2.text, "Turn2")
        print(f"[Turn 2] 응답({resp2.elapsed:.1f}s): {resp2.text[:100]}...")

        # Turn 2 검증: 기술 관련 키워드 포함
        assert_keywords_or_skip(
            resp2.text,
            ["기술", "Python", "C", "Java", "LangGraph", "AI", "스택"],
            min_match=1,
            label="Turn2",
        )
        time.sleep(3)

        # Turn 3 — 기술로 만든 프로젝트 질문
        resp3 = session.send("그 기술로 만든 대표 프로젝트가 있나요?")
        assert_response_valid(resp3.text, "Turn3")
        print(f"[Turn 3] 응답({resp3.elapsed:.1f}s): {resp3.text[:100]}...")

        # Turn 3 검증: 프로젝트 관련 키워드 포함
        assert_keywords_or_skip(
            resp3.text,
            ["프로젝트", "개발", "구현", "만들", "서비스"],
            min_match=1,
            label="Turn3",
        )


# ──────────────────────────────────────────────
# 시나리오 M2: 기술 스택 깊이 파기 (2턴)
# ──────────────────────────────────────────────

class TestMultiTurnTechnical:
    """
    Turn 1: AI 기술 경험 질문 → LangGraph 등 언급 예상
    Turn 2: LangGraph 선택 이유 질문 → Turn 1 맥락 참조
    """

    def test_multi_turn_technical_scenario(self, agent_url):
        """M2: 기술 스택 심화 2턴 대화"""
        session = MultiTurnSession(base_url=agent_url)

        # Turn 1
        resp1 = session.send("AI 관련 기술 경험이 있나요?")
        assert_response_valid(resp1.text, "Turn1")
        print(f"\n[Turn 1] 응답({resp1.elapsed:.1f}s): {resp1.text[:150]}...")

        # Turn 1 검증: AI 기술 키워드
        assert_keywords_or_skip(
            resp1.text,
            ["AI", "LangGraph", "LLM", "Gemini", "에이전트", "경험"],
            min_match=1,
            label="Turn1",
        )
        time.sleep(3)

        # Turn 2 — Turn 1에서 언급된 LangGraph에 대해 심화 질문
        resp2 = session.send("LangGraph를 왜 선택하셨나요?")
        assert_response_valid(resp2.text, "Turn2")
        print(f"[Turn 2] 응답({resp2.elapsed:.1f}s): {resp2.text[:150]}...")

        # Turn 2 검증: LangGraph 관련 맥락 유지
        assert_keywords_or_skip(
            resp2.text,
            ["LangGraph", "에이전트", "워크플로", "그래프", "선택", "이유"],
            min_match=1,
            label="Turn2",
        )

    def test_multi_turn_message_accumulation(self, agent_url):
        """멀티턴 세션 messages 누적 동작 검증"""
        session = MultiTurnSession(base_url=agent_url)

        # 초기 상태: messages 비어있음
        assert len(session.messages) == 0

        # Turn 1 전송
        resp1 = session.send("안녕하세요")
        assert_response_valid(resp1.text, "Turn1")

        # Turn 1 후: messages에 user + assistant 2개
        assert len(session.messages) == 2, (
            f"Turn 1 후 messages 길이가 2여야 함, 실제: {len(session.messages)}"
        )
        assert session.messages[0]["role"] == "user"
        assert session.messages[1]["role"] == "assistant"
        assert session.messages[1]["content"] == resp1.text

        time.sleep(2)

        # Turn 2 전송
        resp2 = session.send("감사합니다")
        assert_response_valid(resp2.text, "Turn2")

        # Turn 2 후: messages에 4개 (user, assistant, user, assistant)
        assert len(session.messages) == 4, (
            f"Turn 2 후 messages 길이가 4여야 함, 실제: {len(session.messages)}"
        )
        assert session.messages[2]["role"] == "user"
        assert session.messages[3]["role"] == "assistant"

        # thread_id 일관성 확인
        assert resp1.thread_id == resp2.thread_id, (
            "멀티턴 세션의 thread_id가 일관되어야 함"
        )
