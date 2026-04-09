"""Gemini LLM factory for PortfolioLive agent"""

import asyncio
import logging
from typing import Any
from google import genai
from google.genai import types as genai_types
from ..config import settings

logger = logging.getLogger(__name__)


def _get_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


FLASH_MODEL = "gemini-2.5-flash"
PRO_MODEL = "gemini-2.5-pro"

# Tool calling 최대 반복 횟수
MAX_TOOL_CALLS = 3


def get_flash() -> genai.Client:
    """Flash 모델 클라이언트 반환"""
    return _get_client()


def get_pro() -> genai.Client:
    """Pro 모델 클라이언트 반환"""
    return _get_client()


def select_model(intent: str, query: str = "") -> str:
    """의도와 쿼리 복잡도 기반 모델 선택

    Args:
        intent: 분류된 의도 (CAREER, TECHNICAL, CONTACT, GREETING, OUT_OF_SCOPE, ABUSE)
        query: 사용자 쿼리 텍스트

    Returns:
        'flash' | 'pro'
    """
    # 단순 응답은 Flash
    if intent in ("OUT_OF_SCOPE", "ABUSE", "GREETING", "CONTACT"):
        return "flash"

    # 쿼리 복잡도 기반 판정
    query_length = len(query)
    if query_length > 200:
        return "pro"

    # 복잡한 질문 키워드
    complex_keywords = ["왜", "비교", "차이", "어떻게", "아키텍처", "설계", "이유", "분석"]
    if any(kw in query for kw in complex_keywords):
        return "pro"

    return "flash"


async def _execute_tool_call(
    tool_functions: dict[str, Any],
    function_call: Any,
) -> str:
    """단일 function_call을 실행하여 결과 문자열 반환"""
    name = function_call.name
    args = dict(function_call.args) if function_call.args else {}

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
    timeout: float = 30.0,
    max_output_tokens: int = 2048,
    temperature: float = 0.7,
    tools: list | None = None,
    tool_functions: dict[str, Any] | None = None,
) -> str:
    """LLM 호출 (동기 API를 executor로 래핑)

    tools가 제공되면 tool calling 루프를 내부에서 완결하고 최종 텍스트를 반환.
    기존 호출자(tools 미지정)는 기존 동작과 동일하게 유지.

    Args:
        model_name: 'flash' | 'pro'
        system_prompt: 시스템 프롬프트
        user_prompt: 사용자 프롬프트
        timeout: 최대 대기 시간 (초, 기본값 30.0)
        max_output_tokens: 최대 출력 토큰 수 (기본값 2048)
        temperature: 생성 온도 (기본값 0.7)
        tools: Gemini Tool 객체 리스트 (None이면 tool calling 비활성)
        tool_functions: tool 이름 → async callable 매핑 (tools와 함께 사용)

    Returns:
        생성된 텍스트

    Raises:
        asyncio.TimeoutError: timeout 초과 시
    """
    client = _get_client()
    model_id = FLASH_MODEL if model_name == "flash" else PRO_MODEL

    # tools 없으면 기존 단순 호출
    if not tools:
        def _sync_call():
            response = client.models.generate_content(
                model=model_id,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                ),
            )
            return response.text

        loop = asyncio.get_running_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(None, _sync_call),
            timeout=timeout,
        )

    # tool calling 루프
    # contents: 대화 히스토리 (user turn → model turn → function response → ...)
    contents: list[genai_types.Content] = [
        genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=user_prompt)],
        )
    ]

    config = genai_types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        tools=tools,
    )

    tool_call_count = 0

    while tool_call_count < MAX_TOOL_CALLS:
        # 동기 호출을 executor로 래핑
        current_contents = list(contents)
        current_config = config

        def _sync_call_with_tools():
            return client.models.generate_content(
                model=model_id,
                contents=current_contents,
                config=current_config,
            )

        loop = asyncio.get_running_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(None, _sync_call_with_tools),
            timeout=timeout,
        )

        # function_call parts 감지
        function_call_parts = []
        text_parts = []

        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "function_call") and part.function_call:
                    function_call_parts.append(part.function_call)
                elif hasattr(part, "text") and part.text:
                    text_parts.append(part.text)

        # function_call이 없으면 최종 응답
        if not function_call_parts:
            return response.text or ""

        # model turn을 contents에 추가
        contents.append(response.candidates[0].content)

        # 각 function_call 실행 후 function_response로 응답
        function_response_parts = []
        for fc in function_call_parts:
            tool_call_count += 1
            if tool_call_count > MAX_TOOL_CALLS:
                break
            result_text = await _execute_tool_call(tool_functions or {}, fc)
            function_response_parts.append(
                genai_types.Part(
                    function_response=genai_types.FunctionResponse(
                        name=fc.name,
                        response={"result": result_text},
                    )
                )
            )

        # function responses를 user turn으로 추가
        contents.append(
            genai_types.Content(
                role="user",
                parts=function_response_parts,
            )
        )

    # MAX_TOOL_CALLS 초과 — 마지막 응답의 텍스트 반환 (혹은 빈 문자열)
    logger.warning(f"[LLM] MAX_TOOL_CALLS ({MAX_TOOL_CALLS}) reached, returning last text")
    try:
        return response.text or ""  # type: ignore[reportPossiblyUnbound]
    except Exception:
        return ""


async def call_llm_stream(model_name: str, system_prompt: str, user_prompt: str):
    """LLM 스트리밍 호출 (chunk 단위 yield)

    Args:
        model_name: 'flash' | 'pro'
        system_prompt: 시스템 프롬프트
        user_prompt: 사용자 프롬프트

    Yields:
        텍스트 청크
    """
    client = _get_client()
    model_id = FLASH_MODEL if model_name == "flash" else PRO_MODEL

    def _sync_stream():
        return client.models.generate_content_stream(
            model=model_id,
            contents=user_prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )

    loop = asyncio.get_running_loop()
    stream = await loop.run_in_executor(None, _sync_stream)

    for chunk in stream:
        if chunk.text:
            yield chunk.text
