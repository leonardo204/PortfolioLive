"""AI 프록시(ai.zerolive.co.kr) 경유 LLM 호출

앱은 OpenRouter 키를 갖지 않는다. 앱 전용 토큰으로 프록시를 부르고,
실제 모델은 프록시의 앱 설정(models 맵)에서 정해진다.
앱이 보내는 것은 '용도 이름'(X-Ai-Kind)뿐이라, 모델 교체에 코드 수정이 필요 없다.

가이드: PROXY-API.md
"""

import asyncio
import json
import logging
from typing import Any

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

# ── 용도 이름 (X-Ai-Kind). 프록시 앱 설정의 models 맵 키와 일치해야 한다.
KIND_FLASH = "flash"
KIND_PRO = "pro"
KIND_GROUNDING = "grounding"

APP_VERSION = "0.1.0"

# Tool calling 최대 반복 횟수
MAX_TOOL_CALLS = 3

# 프록시 상한 (PROXY-API.md 3-1)
PROXY_MAX_TOKENS = 32000

# 용도별 기본 대기 시간(초). pro 계열 추론 모델은 한 턴이 15초 안팎이라 넉넉히 준다.
DEFAULT_TIMEOUT_BY_KIND: dict[str, float] = {
    KIND_FLASH: 30.0,
    KIND_PRO: 60.0,
    KIND_GROUNDING: 25.0,
}
FALLBACK_TIMEOUT = 30.0

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    """커넥션을 재사용하는 공용 HTTP 클라이언트."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=settings.ai_proxy_url.rstrip("/"),
            timeout=httpx.Timeout(130.0, connect=10.0),
        )
    return _client


async def close_client() -> None:
    """앱 종료 시 커넥션 정리."""
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None


class ProxyError(RuntimeError):
    """프록시 호출 실패. status로 사용자 안내 문구를 가른다."""

    def __init__(self, status: int, detail: str) -> None:
        super().__init__(f"[{status}] {detail}")
        self.status = status
        self.detail = detail


# 상태 코드별 사용자 안내 (PROXY-API.md 7장). 실패를 조용히 넘기지 않는다.
_USER_MESSAGE_BY_STATUS: dict[int, str] = {
    400: "요청을 처리하지 못했습니다. 질문을 조금 바꿔서 다시 시도해 주세요.",
    401: "AI 연결 설정에 문제가 있습니다. 관리자에게 문의해 주세요.",
    403: "AI 기능이 현재 중지돼 있습니다. 관리자에게 문의해 주세요.",
    413: "질문이 너무 깁니다. 조금 줄여서 다시 보내주세요.",
    429: "요청이 몰리고 있습니다. 잠시 후 다시 시도해 주세요.",
    500: "AI 서버 설정에 문제가 있습니다. 관리자에게 문의해 주세요.",
    502: "AI 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
}
DEFAULT_USER_MESSAGE = "죄송합니다. 잠시 후 다시 시도해주세요."


def user_message_for(exc: BaseException) -> str:
    """예외를 사용자에게 보여줄 안내 문구로 바꾼다."""
    if isinstance(exc, ProxyError):
        return _USER_MESSAGE_BY_STATUS.get(exc.status, DEFAULT_USER_MESSAGE)
    if isinstance(exc, (asyncio.TimeoutError, httpx.TimeoutException)):
        return "응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
    return DEFAULT_USER_MESSAGE


def select_model(intent: str, query: str = "") -> str:
    """의도와 쿼리 복잡도 기반 용도 선택

    Args:
        intent: 분류된 의도 (CAREER, TECHNICAL, CONTACT, GREETING, OUT_OF_SCOPE, ABUSE)
        query: 사용자 쿼리 텍스트

    Returns:
        'flash' | 'pro'  (프록시 models 맵의 키)
    """
    # 단순 응답은 flash
    if intent in ("OUT_OF_SCOPE", "ABUSE", "GREETING", "CONTACT"):
        return KIND_FLASH

    # 쿼리 복잡도 기반 판정
    if len(query) > 200:
        return KIND_PRO

    complex_keywords = ["왜", "비교", "차이", "어떻게", "아키텍처", "설계", "이유", "분석"]
    if any(kw in query for kw in complex_keywords):
        return KIND_PRO

    return KIND_FLASH


def build_meta(screen: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    """통계용 부가 정보. 개인정보는 절대 넣지 않는다 (PROXY-API.md 3-4)."""
    meta: dict[str, Any] = {"ver": APP_VERSION, "screen": screen}
    if extra:
        meta.update(extra)
    return meta


async def proxy_post(
    path: str,
    payload: dict[str, Any],
    *,
    kind: str | None = None,
    timeout: float | None = None,
) -> dict[str, Any]:
    """프록시 호출. 실패하면 ProxyError를 던진다(응답 원본을 가리지 않는다)."""
    if not settings.ai_proxy_token:
        raise ProxyError(401, "AI_PROXY_TOKEN이 설정되지 않았습니다.")

    headers = {
        "Authorization": f"Bearer {settings.ai_proxy_token}",
        "Content-Type": "application/json",
    }
    if kind:
        headers["X-Ai-Kind"] = kind

    client = _get_client()
    try:
        resp = await client.post(
            path,
            json=payload,
            headers=headers,
            timeout=timeout if timeout is not None else httpx.USE_CLIENT_DEFAULT,
        )
    except httpx.TimeoutException as e:
        raise ProxyError(502, f"timeout: {e}") from e
    except httpx.HTTPError as e:
        raise ProxyError(502, f"connection: {e}") from e

    if resp.status_code != 200:
        body = resp.text[:400]
        logger.error(f"[Proxy] {path} kind={kind} -> {resp.status_code}: {body}")
        raise ProxyError(resp.status_code, body)

    try:
        return resp.json()
    except ValueError as e:
        raise ProxyError(502, f"응답 파싱 실패: {resp.text[:200]}") from e


async def _execute_tool_call(
    tool_functions: dict[str, Any],
    tool_call: dict[str, Any],
) -> str:
    """단일 tool_call을 실행하여 결과 문자열 반환"""
    fn_spec = tool_call.get("function") or {}
    name = fn_spec.get("name") or ""

    raw_args = fn_spec.get("arguments") or "{}"
    if isinstance(raw_args, dict):
        args = raw_args
    else:
        try:
            args = json.loads(raw_args) if raw_args.strip() else {}
        except json.JSONDecodeError:
            logger.warning(f"[LLM] Tool '{name}' arguments 파싱 실패: {raw_args[:200]}")
            return "tool 인자를 해석하지 못했습니다."

    if name not in tool_functions:
        logger.warning(f"[LLM] Unknown tool: {name}")
        return f"알 수 없는 tool: {name}"

    fn = tool_functions[name]
    try:
        logger.info(f"[LLM] Calling tool '{name}' with args: {args}")
        result = await fn(**args)
        logger.info(f"[LLM] Tool '{name}' returned {len(str(result))} chars")
        return str(result)
    except Exception as e:
        logger.error(f"[LLM] Tool '{name}' failed: {e}")
        return f"tool 실행 중 오류 발생: {e}"


async def call_llm(
    model_name: str,
    system_prompt: str,
    user_prompt: str,
    *,
    timeout: float | None = None,
    max_output_tokens: int = 2048,
    temperature: float = 0.7,
    tools: list | None = None,
    tool_functions: dict[str, Any] | None = None,
    tool_choice: str = "auto",
    screen: str = "agent",
) -> str:
    """프록시 경유 LLM 호출

    tools가 제공되면 tool calling 루프를 내부에서 완결하고 최종 텍스트를 반환한다.

    Args:
        model_name: 'flash' | 'pro'  (프록시 models 맵의 키로 그대로 전달)
        system_prompt: 시스템 프롬프트
        user_prompt: 사용자 프롬프트
        timeout: 최대 대기 시간 (초). None이면 용도별 기본값을 쓴다.
        max_output_tokens: 최대 출력 토큰 수
        temperature: 생성 온도 (openai/ 계열 모델에서는 무시된다)
        tools: OpenAI 형식 tools 리스트 (None이면 tool calling 비활성)
        tool_functions: tool 이름 → async callable 매핑
        tool_choice: 첫 요청에서 도구를 부를지 정한다.
            'auto'는 모델 판단에 맡기고, 'required'는 반드시 하나를 부르게 한다.
            두 번째 요청부터는 항상 'auto'로 돌린다. 계속 'required'면
            모델이 매 차례 도구를 불러야 해서 답변을 끝맺지 못한다.
        screen: 통계용 호출 지점 이름

    Returns:
        생성된 텍스트

    Raises:
        ProxyError: 프록시·상류 오류
    """
    if timeout is None:
        timeout = DEFAULT_TIMEOUT_BY_KIND.get(model_name, FALLBACK_TIMEOUT)

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    payload: dict[str, Any] = {
        "messages": messages,
        # 일반 텍스트 응답이므로 반드시 명시한다. 생략하면 서버가 json_object를 넣는다.
        "response_format": {"type": "text"},
        "max_tokens": min(max_output_tokens, PROXY_MAX_TOKENS),
        "temperature": temperature,
        "meta": build_meta(screen),
    }

    # tools 없으면 단순 1회 호출
    if not tools:
        data = await proxy_post("/v1/ai", payload, kind=model_name, timeout=timeout)
        return _first_text(data)

    payload["tools"] = tools
    payload["tool_choice"] = tool_choice

    tool_call_count = 0
    data: dict[str, Any] = {}

    while tool_call_count < MAX_TOOL_CALLS:
        data = await proxy_post("/v1/ai", payload, kind=model_name, timeout=timeout)
        message = _first_message(data)
        tool_calls = message.get("tool_calls") or []

        # tool_call이 없으면 최종 응답
        if not tool_calls:
            return (message.get("content") or "").strip()

        # 도구를 한 번 부른 뒤에는 모델이 답변을 끝맺을 수 있어야 한다.
        payload["tool_choice"] = "auto"

        # assistant turn을 히스토리에 추가
        messages.append(
            {
                "role": "assistant",
                "content": message.get("content") or "",
                "tool_calls": tool_calls,
            }
        )

        for tc in tool_calls:
            tool_call_count += 1
            if tool_call_count > MAX_TOOL_CALLS:
                break
            result_text = await _execute_tool_call(tool_functions or {}, tc)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.get("id") or "",
                    "content": result_text,
                }
            )

    logger.warning(f"[LLM] MAX_TOOL_CALLS ({MAX_TOOL_CALLS}) reached, returning last text")
    return _first_text(data)


async def call_llm_grounded(
    system_prompt: str,
    user_prompt: str,
    *,
    timeout: float = 25.0,
    max_output_tokens: int = 1024,
    temperature: float = 0.5,
    screen: str = "grounding",
) -> tuple[str, list[dict[str, str]]]:
    """웹 검색을 켠 채 호출하고 (본문, 출처 목록)을 돌려준다.

    실제 웹검색 여부는 프록시 앱 설정의 'grounding' 용도가 어떤 모델에
    매핑돼 있는지로 정해진다. 앱 코드는 모델을 알지 못한다.
    """
    payload: dict[str, Any] = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "text"},
        "max_tokens": min(max_output_tokens, PROXY_MAX_TOKENS),
        "temperature": temperature,
        "meta": build_meta(screen),
    }
    data = await proxy_post("/v1/ai", payload, kind=KIND_GROUNDING, timeout=timeout)
    return _first_text(data), _citations_of(data)


def _first_message(data: dict[str, Any]) -> dict[str, Any]:
    """OpenRouter 응답에서 첫 choice의 message를 꺼낸다."""
    choices = data.get("choices") or []
    if not choices:
        return {}
    return choices[0].get("message") or {}


def _first_text(data: dict[str, Any]) -> str:
    """OpenRouter 응답에서 본문 텍스트를 꺼낸다.

    max_tokens가 추론에 소진되면 content가 null에 finish_reason='length'가 온다.
    (PROXY-API.md 8-②)
    """
    choices = data.get("choices") or []
    if not choices:
        return ""
    choice = choices[0]
    content = (choice.get("message") or {}).get("content")
    if not content and choice.get("finish_reason") == "length":
        logger.warning("[LLM] content 없음 (finish_reason=length) — max_tokens 부족")
    return (content or "").strip()


def _citations_of(data: dict[str, Any]) -> list[dict[str, str]]:
    """웹검색 응답의 출처(url_citation)를 추려낸다."""
    message = _first_message(data)
    out: list[dict[str, str]] = []
    for ann in message.get("annotations") or []:
        cite = ann.get("url_citation") or {}
        url = cite.get("url")
        if url:
            out.append({"title": cite.get("title") or url, "url": url})
    return out
