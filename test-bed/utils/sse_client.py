"""AG-UI SSE 클라이언트 — /awp 엔드포인트 호출 및 SSE 스트림 파싱"""

import json
import uuid
from dataclasses import dataclass, field
from typing import Generator

import httpx


# ──────────────────────────────────────────────
# 이벤트 타입 상수
# ──────────────────────────────────────────────

EVENT_RUN_STARTED = "RUN_STARTED"
EVENT_STATE_DELTA = "STATE_DELTA"
EVENT_TEXT_MESSAGE_START = "TEXT_MESSAGE_START"
EVENT_TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT"
EVENT_TEXT_MESSAGE_END = "TEXT_MESSAGE_END"
EVENT_RUN_FINISHED = "RUN_FINISHED"


# ──────────────────────────────────────────────
# SSE 이벤트 파싱
# ──────────────────────────────────────────────

def parse_sse_stream(raw: str) -> Generator[dict, None, None]:
    """
    SSE 원문 텍스트를 파싱하여 이벤트 dict를 yield.
    형식: 'data: {...}\\n\\n' 라인들
    """
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("data:"):
            data_str = line[len("data:"):].strip()
            if data_str:
                try:
                    yield json.loads(data_str)
                except json.JSONDecodeError:
                    pass


# ──────────────────────────────────────────────
# 응답 결과 컨테이너
# ──────────────────────────────────────────────

@dataclass
class AgentResponse:
    text: str                    # 누적된 전체 텍스트
    events: list[dict]           # 수신된 모든 이벤트
    thread_id: str = ""
    run_id: str = ""
    elapsed: float = 0.0         # 응답 시간(초)


# ──────────────────────────────────────────────
# 단건 호출
# ──────────────────────────────────────────────

def call_agent(
    messages: list[dict],
    *,
    base_url: str = "http://localhost:3101",
    thread_id: str | None = None,
    page_context: str = "",
    timeout: float = 35.0,
) -> AgentResponse:
    """
    POST /awp 를 호출하고 SSE 스트림을 파싱하여 AgentResponse를 반환.

    Parameters
    ----------
    messages: AG-UI 형식 메시지 목록 [{"role": "user"|"assistant", "content": "..."}]
    base_url: 서버 기본 URL
    thread_id: 멀티턴용 스레드 ID (None이면 자동 생성)
    page_context: 현재 페이지 경로 (예: "/portfolio/portfoliolive")
    timeout: 요청 타임아웃(초)
    """
    import time

    if thread_id is None:
        thread_id = str(uuid.uuid4())

    body = {
        "threadId": thread_id,
        "messages": messages,
        "page_context": page_context,
    }

    start = time.monotonic()
    with httpx.Client(timeout=timeout) as client:
        response = client.post(
            f"{base_url}/awp",
            json=body,
            headers={"Accept": "text/event-stream"},
        )
        response.raise_for_status()
        raw = response.text
    elapsed = time.monotonic() - start

    events = list(parse_sse_stream(raw))

    # 텍스트 누적
    text_parts = []
    found_thread_id = thread_id
    found_run_id = ""

    for ev in events:
        ev_type = ev.get("type", "")
        if ev_type == EVENT_RUN_STARTED:
            found_thread_id = ev.get("threadId", thread_id)
            found_run_id = ev.get("runId", "")
        elif ev_type == EVENT_TEXT_MESSAGE_CONTENT:
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
# 멀티턴 세션 클래스
# ──────────────────────────────────────────────

class MultiTurnSession:
    """
    멀티턴 대화 세션 관리.

    서버가 stateless이므로 messages 배열에 이전 user/assistant 응답을 모두
    누적하여 전달한다. threadId는 동일하게 유지한다.
    """

    def __init__(
        self,
        base_url: str = "http://localhost:3101",
        thread_id: str | None = None,
        timeout: float = 35.0,
    ):
        self.base_url = base_url
        self.thread_id = thread_id or str(uuid.uuid4())
        self.timeout = timeout
        self.messages: list[dict] = []      # 누적 대화 히스토리
        self.responses: list[AgentResponse] = []

    def send(self, user_text: str, page_context: str = "") -> AgentResponse:
        """
        사용자 메시지를 전송하고 assistant 응답을 히스토리에 추가.

        Returns
        -------
        AgentResponse
        """
        # user 메시지 추가
        self.messages.append({"role": "user", "content": user_text})

        # 서버 호출 (전체 누적 히스토리 전달)
        resp = call_agent(
            messages=self.messages,
            base_url=self.base_url,
            thread_id=self.thread_id,
            page_context=page_context,
            timeout=self.timeout,
        )

        # assistant 응답을 히스토리에 추가
        if resp.text:
            self.messages.append({"role": "assistant", "content": resp.text})

        self.responses.append(resp)
        return resp

    def reset(self) -> None:
        """대화 히스토리 초기화 (thread_id 유지)"""
        self.messages.clear()
        self.responses.clear()
