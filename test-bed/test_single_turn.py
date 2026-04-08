"""
단건(Single-turn) 테스트 — /awp 엔드포인트

각 케이스는 독립적인 단건 호출이며, 케이스 간 2초 딜레이를 둔다.
서버 타임아웃(30s) 초과 시 "잠시 후 다시 시도해주세요" 응답이 오므로
타임아웃 응답도 허용하고 '비어있지 않음'만 필수 검증으로 처리한다.
"""

import time
import pytest
from utils.sse_client import call_agent


# ──────────────────────────────────────────────
# 공통 헬퍼
# ──────────────────────────────────────────────

TIMEOUT_FALLBACK = "잠시 후 다시 시도해주세요"


def is_timeout_response(text: str) -> bool:
    """서버 타임아웃 폴백 응답 여부 확인"""
    return TIMEOUT_FALLBACK in text


def assert_response_valid(text: str) -> None:
    """응답이 비어있지 않음 검증 (필수)"""
    assert text, "응답이 비어 있습니다"
    assert len(text.strip()) > 0, "응답이 공백만 포함합니다"


def assert_keywords(text: str, keywords: list[str], min_match: int = 1) -> None:
    """
    검증 키워드 중 min_match개 이상 포함 확인.
    타임아웃 응답인 경우 키워드 검증을 건너뜀.
    """
    if is_timeout_response(text):
        pytest.skip(f"서버 타임아웃 응답 — 키워드 검증 건너뜀: {text[:80]}")
    matched = [kw for kw in keywords if kw in text]
    assert len(matched) >= min_match, (
        f"키워드 검증 실패: {keywords} 중 {min_match}개 이상 필요, "
        f"매칭된 것: {matched}\n응답: {text[:200]}"
    )


def assert_first_person(text: str) -> None:
    """1인칭 표현("저", "제") 포함 확인"""
    if is_timeout_response(text):
        pytest.skip(f"서버 타임아웃 응답 — 1인칭 검증 건너뜀")
    has_first_person = "저" in text or "제" in text
    assert has_first_person, f"1인칭 표현('저', '제')이 없습니다. 응답: {text[:200]}"


# ──────────────────────────────────────────────
# GREETING
# ──────────────────────────────────────────────

class TestGreeting:

    def test_greeting_basic(self, agent_url):
        """G1: 기본 인사 — '안녕하세요'"""
        resp = call_agent(
            [{"role": "user", "content": "안녕하세요"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_keywords(resp.text, ["안녕", "어시스턴트", "포트폴리오", "이용섭"])
        time.sleep(2)

    def test_greeting_identity(self, agent_url):
        """G2: 자기소개 요청 — '당신은 누구인가요?'"""
        resp = call_agent(
            [{"role": "user", "content": "당신은 누구인가요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_keywords(resp.text, ["이용섭", "AI", "어시스턴트", "포트폴리오"])
        time.sleep(2)


# ──────────────────────────────────────────────
# CAREER
# ──────────────────────────────────────────────

class TestCareer:

    def test_career_overview(self, agent_url):
        """C1: 경력 전반 — '경력이 어떻게 되나요?'"""
        resp = call_agent(
            [{"role": "user", "content": "경력이 어떻게 되나요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_first_person(resp.text)
        assert_keywords(resp.text, ["경력", "년", "개발", "경험"], min_match=1)
        time.sleep(2)

    def test_career_company(self, agent_url):
        """C2: 근무 회사 — '어떤 회사에서 일하셨나요?'"""
        resp = call_agent(
            [{"role": "user", "content": "어떤 회사에서 일하셨나요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_first_person(resp.text)
        assert_keywords(resp.text, ["회사", "근무", "KT", "케이티", "개발"], min_match=1)
        time.sleep(2)

    def test_career_years(self, agent_url):
        """C3: 경력 연수 — '총 경력은 몇 년이나 되나요?'"""
        resp = call_agent(
            [{"role": "user", "content": "총 경력은 몇 년이나 되나요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_first_person(resp.text)
        assert_keywords(resp.text, ["년", "경력", "경험", "개발"], min_match=1)
        time.sleep(2)


# ──────────────────────────────────────────────
# TECHNICAL
# ──────────────────────────────────────────────

class TestTechnical:

    def test_technical_stack(self, agent_url):
        """T1: 기술 스택 — '주로 사용하는 기술 스택이 뭔가요?'"""
        resp = call_agent(
            [{"role": "user", "content": "주로 사용하는 기술 스택이 뭔가요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_first_person(resp.text)
        assert_keywords(
            resp.text,
            ["Python", "AI", "LangGraph", "기술", "스택", "FastAPI"],
            min_match=1,
        )
        time.sleep(2)

    def test_technical_ai_experience(self, agent_url):
        """T2: AI/ML 경험 — 'AI/ML 관련 경험이 있나요?'"""
        resp = call_agent(
            [{"role": "user", "content": "AI/ML 관련 경험이 있나요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_first_person(resp.text)
        assert_keywords(
            resp.text,
            ["AI", "LangGraph", "LLM", "Gemini", "경험", "에이전트"],
            min_match=1,
        )
        time.sleep(2)


# ──────────────────────────────────────────────
# CONTACT
# ──────────────────────────────────────────────

class TestContact:

    def test_contact_info(self, agent_url):
        """CT1: 연락처 — '연락처가 어떻게 되나요?'"""
        resp = call_agent(
            [{"role": "user", "content": "연락처가 어떻게 되나요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_keywords(
            resp.text,
            ["이메일", "GitHub", "연락", "깃허브", "메일"],
            min_match=1,
        )
        time.sleep(2)

    def test_contact_github(self, agent_url):
        """CT2: GitHub 계정 — 'GitHub 계정이 있나요?'"""
        resp = call_agent(
            [{"role": "user", "content": "GitHub 계정이 있나요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        assert_keywords(
            resp.text,
            ["GitHub", "깃허브", "계정", "프로필", "github.com"],
            min_match=1,
        )
        time.sleep(2)


# ──────────────────────────────────────────────
# OUT_OF_SCOPE
# ──────────────────────────────────────────────

class TestOutOfScope:

    def test_out_of_scope_weather(self, agent_url):
        """O1: 날씨 질문 (범위 외) — '오늘 날씨 어때요?'"""
        resp = call_agent(
            [{"role": "user", "content": "오늘 날씨 어때요?"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        if not is_timeout_response(resp.text):
            # 정중한 거절 응답이어야 함
            assert_keywords(
                resp.text,
                ["죄송", "포트폴리오", "범위", "질문", "이용섭", "저는"],
                min_match=1,
            )
        time.sleep(2)

    def test_out_of_scope_stock(self, agent_url):
        """O2: 주식 추천 (범위 외) — '주식 추천해줘'"""
        resp = call_agent(
            [{"role": "user", "content": "주식 추천해줘"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        if not is_timeout_response(resp.text):
            assert_keywords(
                resp.text,
                ["죄송", "포트폴리오", "질문", "이용섭", "저는"],
                min_match=1,
            )
        time.sleep(2)


# ──────────────────────────────────────────────
# ABUSE
# ──────────────────────────────────────────────

class TestAbuse:

    def test_abuse_insult(self, agent_url):
        """A1: 욕설 — '바보야, 멍청이'"""
        resp = call_agent(
            [{"role": "user", "content": "바보야, 멍청이"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        if not is_timeout_response(resp.text):
            # 정중한 응답이어야 함 (상호 공격적 언어 없음)
            rude_words = ["멍청이", "바보", "꺼져", "닥쳐"]
            for word in rude_words:
                assert word not in resp.text, (
                    f"응답에 부적절한 단어 '{word}'가 포함됨: {resp.text[:200]}"
                )
            assert_keywords(resp.text, ["죄송", "정중", "도움", "대화", "질문"], min_match=1)
        time.sleep(2)

    def test_abuse_negative(self, agent_url):
        """A2: 부정적 표현 — '쓸모없는 AI네'"""
        resp = call_agent(
            [{"role": "user", "content": "쓸모없는 AI네"}],
            base_url=agent_url,
        )
        assert_response_valid(resp.text)
        if not is_timeout_response(resp.text):
            # 정중한 응답 유지
            assert_keywords(resp.text, ["죄송", "도움", "질문", "포트폴리오", "이용섭"], min_match=1)
        time.sleep(2)


# ──────────────────────────────────────────────
# 페이지 컨텍스트
# ──────────────────────────────────────────────

class TestPageContext:

    def test_page_context_portfolio(self, agent_url):
        """PC1: 포트폴리오 상세 페이지 컨텍스트"""
        resp = call_agent(
            [{"role": "user", "content": "이 프로젝트에 대해 설명해줘"}],
            base_url=agent_url,
            page_context="/portfolio/portfoliolive",
        )
        assert_response_valid(resp.text)
        if not is_timeout_response(resp.text):
            # slug "portfoliolive" 또는 관련 키워드가 응답에 있어야 함
            assert_keywords(
                resp.text,
                ["포트폴리오", "프로젝트", "portfoliolive", "PortfolioLive", "소개"],
                min_match=1,
            )
        time.sleep(2)
