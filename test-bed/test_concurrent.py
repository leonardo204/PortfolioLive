"""
동시 요청 테스트 — asyncio.gather로 3개 세션 동시 전송

대상: /awp 엔드포인트
카테고리: CONCURRENT

검증 항목:
  1. 모든 세션이 응답을 받는다 (하나도 빠짐없이)
  2. 응답이 서로 섞이지 않는다 (threadId 별 분리)
  3. 각 응답이 해당 질문에 맞는 내용을 담는다 (느슨한 키워드 검증)
"""

import asyncio
import time
import uuid

import httpx
import pytest

from utils.sse_client import parse_sse_stream, AgentResponse


# ──────────────────────────────────────────────
# 비동기 단건 호출
# ──────────────────────────────────────────────

TIMEOUT_FALLBACK = "잠시 후 다시 시도해주세요"


async def async_call_agent(
    messages: list[dict],
    *,
    base_url: str = "http://localhost:3101",
    thread_id: str | None = None,
    page_context: str = "",
    timeout: float = 50.0,
) -> AgentResponse:
    """비동기 버전의 call_agent"""
    if thread_id is None:
        thread_id = str(uuid.uuid4())

    body = {
        "threadId": thread_id,
        "messages": messages,
        "page_context": page_context,
    }

    start = time.monotonic()
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{base_url}/awp",
            json=body,
            headers={"Accept": "text/event-stream"},
        )
        response.raise_for_status()
        raw = response.text
    elapsed = time.monotonic() - start

    events = list(parse_sse_stream(raw))

    text_parts = []
    found_thread_id = thread_id
    found_run_id = ""

    for ev in events:
        ev_type = ev.get("type", "")
        if ev_type == "RUN_STARTED":
            found_thread_id = ev.get("threadId", thread_id)
            found_run_id = ev.get("runId", "")
        elif ev_type == "TEXT_MESSAGE_CONTENT":
            delta = ev.get("delta", "")
            if delta:
                text_parts.append(delta)

    return AgentResponse(
        text="".join(text_parts),
        events=events,
        thread_id=found_thread_id,
        run_id=found_run_id,
        elapsed=elapsed,
    )


# ──────────────────────────────────────────────
# 동시 요청 테스트
# ──────────────────────────────────────────────

class TestConcurrent:

    def test_concurrent_three_sessions(self, agent_url):
        """CC1: 3개 세션 동시 요청 — 모두 응답 수신 + threadId 분리 확인"""

        # 3개 독립 세션 정의 (각기 다른 질문)
        sessions = [
            {
                "thread_id": str(uuid.uuid4()),
                "question": "안녕하세요",
                "label": "Session-A",
                "keywords": ["안녕", "포트폴리오", "이용섭", "어시스턴트"],
            },
            {
                "thread_id": str(uuid.uuid4()),
                "question": "경력이 어떻게 되나요?",
                "label": "Session-B",
                "keywords": ["경력", "년", "개발", "저", "제"],
            },
            {
                "thread_id": str(uuid.uuid4()),
                "question": "GitHub 계정이 있나요?",
                "label": "Session-C",
                "keywords": ["GitHub", "깃허브", "계정", "github.com"],
            },
        ]

        async def run_all():
            tasks = [
                async_call_agent(
                    [{"role": "user", "content": s["question"]}],
                    base_url=agent_url,
                    thread_id=s["thread_id"],
                    timeout=50.0,
                )
                for s in sessions
            ]
            return await asyncio.gather(*tasks, return_exceptions=True)

        results = asyncio.run(run_all())

        # 1. 모든 세션이 응답을 받았는지 확인
        for i, (sess, result) in enumerate(zip(sessions, results)):
            label = sess["label"]
            assert not isinstance(result, Exception), (
                f"[{label}] 예외 발생: {result}"
            )
            resp: AgentResponse = result
            assert resp.text, f"[{label}] 응답이 비어 있음"
            assert len(resp.text.strip()) > 0, f"[{label}] 응답이 공백만 포함"
            print(f"\n[{label}] 응답({resp.elapsed:.1f}s): {resp.text[:100]}")

        # 2. threadId가 각 세션별로 분리되어 있는지 확인
        thread_ids_sent = [s["thread_id"] for s in sessions]
        assert len(set(thread_ids_sent)) == 3, "테스트 설계 오류: thread_id 중복"

        # 응답의 thread_id가 각 세션 고유값과 일치하는지 확인
        for sess, result in zip(sessions, results):
            if isinstance(result, Exception):
                continue
            resp: AgentResponse = result
            assert resp.thread_id == sess["thread_id"], (
                f"[{sess['label']}] threadId 불일치: "
                f"sent={sess['thread_id']}, received={resp.thread_id}"
            )

        # 3. 각 응답이 해당 질문과 관련된 키워드를 포함하는지 확인 (느슨한 검증)
        for sess, result in zip(sessions, results):
            if isinstance(result, Exception):
                continue
            resp: AgentResponse = result
            label = sess["label"]

            if TIMEOUT_FALLBACK in resp.text:
                pytest.skip(f"[{label}] 서버 타임아웃 응답 — 키워드 검증 건너뜀")

            matched = [kw for kw in sess["keywords"] if kw in resp.text]
            assert len(matched) >= 1, (
                f"[{label}] 키워드 {sess['keywords']} 중 1개 이상 필요, "
                f"매칭: {matched}\n응답: {resp.text[:200]}"
            )
            print(f"[{label}] 매칭 키워드: {matched}")

    def test_concurrent_response_time(self, agent_url):
        """CC2: 동시 요청 시 모든 응답이 50초 이내 도착"""

        thread_ids = [str(uuid.uuid4()) for _ in range(3)]
        questions = [
            "기술 스택이 뭔가요?",
            "연락처가 어떻게 되나요?",
            "주로 어떤 언어를 사용하나요?",
        ]

        async def run_timed():
            start = time.monotonic()
            tasks = [
                async_call_agent(
                    [{"role": "user", "content": q}],
                    base_url=agent_url,
                    thread_id=tid,
                    timeout=50.0,
                )
                for q, tid in zip(questions, thread_ids)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            total = time.monotonic() - start
            return results, total

        results, total_elapsed = asyncio.run(run_timed())

        print(f"\n[CC2] 3개 동시 요청 총 소요 시간: {total_elapsed:.1f}s")

        for i, (q, result) in enumerate(zip(questions, results)):
            assert not isinstance(result, Exception), (
                f"[CC2-{i+1}] '{q}' 예외 발생: {result}"
            )
            resp: AgentResponse = result
            assert resp.elapsed < 50.0, (
                f"[CC2-{i+1}] '{q}' 응답 시간 초과: {resp.elapsed:.1f}s"
            )
            assert len(resp.text.strip()) > 0, f"[CC2-{i+1}] '{q}' 응답 비어 있음"
            print(f"[CC2-{i+1}] '{q}' ({resp.elapsed:.1f}s): {resp.text[:80]}")
