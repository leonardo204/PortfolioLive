"""Gemini LLM factory for PortfolioLive agent"""

import asyncio
from google import genai
from google.genai import types as genai_types
from ..config import settings


def _get_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


FLASH_MODEL = "gemini-2.5-flash"
PRO_MODEL = "gemini-2.5-pro"


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


async def call_llm(
    model_name: str,
    system_prompt: str,
    user_prompt: str,
    *,
    timeout: float = 30.0,
    max_output_tokens: int = 2048,
    temperature: float = 0.7,
) -> str:
    """LLM 호출 (동기 API를 executor로 래핑)

    Args:
        model_name: 'flash' | 'pro'
        system_prompt: 시스템 프롬프트
        user_prompt: 사용자 프롬프트
        timeout: 최대 대기 시간 (초, 기본값 30.0)
        max_output_tokens: 최대 출력 토큰 수 (기본값 2048)
        temperature: 생성 온도 (기본값 0.7)

    Returns:
        생성된 텍스트

    Raises:
        asyncio.TimeoutError: timeout 초과 시
    """
    client = _get_client()
    model_id = FLASH_MODEL if model_name == "flash" else PRO_MODEL

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

    loop = asyncio.get_event_loop()
    return await asyncio.wait_for(
        loop.run_in_executor(None, _sync_call),
        timeout=timeout,
    )


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

    loop = asyncio.get_event_loop()
    stream = await loop.run_in_executor(None, _sync_stream)

    for chunk in stream:
        if chunk.text:
            yield chunk.text
