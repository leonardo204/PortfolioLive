"""임베딩 생성 (AI 프록시 경유)

POST /v1/embeddings — 배열로 보내면 한 번에 여러 건을 처리한다.

주 모델(gemini-embedding-001)은 한국어 검색 품질이 가장 좋지만, 상류
(OpenRouter↔Vertex)의 공용 분당 쿼터가 차면 429가 난다. 우리 호출량과 무관하게
발생하므로 짧게 몇 번 다시 시도하고, 그래도 안 되면 예비 모델로 넘어간다.
예비 모델은 벡터 공간이 달라 전용 색인 테이블에서 검색해야 한다.
"""

import asyncio
import logging
from collections import OrderedDict

from ..config import settings
from ..llm.factory import ProxyError, proxy_post, build_meta

logger = logging.getLogger(__name__)

# 한 번에 보낼 문장 수. 8MB 본문 상한과 응답 크기를 고려한 값.
BATCH_SIZE = 50
MAX_RETRIES = 3
RETRY_DELAY = 2.0
EMBED_TIMEOUT = 60.0

# 429 재시도 간격. 쿼터가 계속 흘러나가므로 길게 기다리지 않는다.
RATE_LIMIT_DELAYS = (0.8, 1.6, 3.0)

# 질의 임베딩 캐시. 같은 질문에 대한 사전 검색과 rag_search 도구 호출이
# 같은 문장을 두 번 임베딩하는 것을 막고, 반복 질문의 상류 호출을 없앤다.
QUERY_CACHE_SIZE = 256
_query_cache: "OrderedDict[tuple[str, int, str], list[float]]" = OrderedDict()


def _cache_get(key):
    v = _query_cache.get(key)
    if v is not None:
        _query_cache.move_to_end(key)
    return v


def _cache_put(key, value: list[float]) -> None:
    _query_cache[key] = value
    _query_cache.move_to_end(key)
    while len(_query_cache) > QUERY_CACHE_SIZE:
        _query_cache.popitem(last=False)


class Embedder:
    """프록시 임베딩 클라이언트.

    model을 지정하지 않으면 주 모델을 쓴다. 예비 색인을 만들 때만 명시한다.
    """

    def __init__(self, model: str | None = None) -> None:
        self.model = model or settings.ai_embedding_model
        self.fallback_model = settings.ai_embedding_fallback_model
        self.dimensions = settings.ai_embedding_dimensions

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """텍스트 리스트를 임베딩합니다. BATCH_SIZE개씩 묶어 보냅니다."""
        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i : i + BATCH_SIZE]
            all_embeddings.extend(await self._embed_batch_with_retry(batch, self.model))
        return all_embeddings

    async def embed_text(self, text: str) -> list[float]:
        """단일 텍스트 임베딩(주 모델 고정). 색인 경로에서 쓴다."""
        vector, _ = await self._embed_query_with(self.model, text)
        return vector

    async def embed_query(self, text: str) -> tuple[list[float], str]:
        """질의 임베딩. 주 모델이 막히면 예비 모델로 넘어간다.

        Returns:
            (벡터, 실제로 사용한 모델 이름)
        """
        try:
            return await self._embed_query_with(self.model, text)
        except Exception as e:
            logger.warning(f"[Embedder] 주 모델 실패 → 예비 모델로 전환: {e}")

        vector, model = await self._embed_query_with(self.fallback_model, text)
        logger.info(f"[Embedder] 예비 모델 사용: {model}")
        return vector, model

    async def _embed_query_with(self, model: str, text: str) -> tuple[list[float], str]:
        key = (model, self.dimensions, text)
        cached = _cache_get(key)
        if cached is not None:
            return cached, model

        vector = (await self._embed_batch_with_retry([text], model))[0]
        _cache_put(key, vector)
        return vector, model

    async def _embed_batch_with_retry(
        self, texts: list[str], model: str
    ) -> list[list[float]]:
        """재시도 로직을 포함한 배치 임베딩"""
        last_error: Exception | None = None

        for attempt in range(MAX_RETRIES):
            try:
                return await self._embed_batch(texts, model)
            except ProxyError as e:
                last_error = e
                # 인증·중지·본문 초과는 재시도해도 같은 결과다.
                if e.status in (401, 403, 413):
                    raise
                if e.status == 429:
                    delay = RATE_LIMIT_DELAYS[min(attempt, len(RATE_LIMIT_DELAYS) - 1)]
                else:
                    delay = RETRY_DELAY * (attempt + 1)
                logger.warning(
                    f"[Embedder] {model} 재시도 {attempt + 1}/{MAX_RETRIES} "
                    f"(응답 {e.status}, {delay:.1f}초 대기)"
                )
            except Exception as e:
                last_error = e
                delay = RETRY_DELAY * (attempt + 1)
                logger.warning(
                    f"[Embedder] {model} 재시도 {attempt + 1}/{MAX_RETRIES}: {e}"
                )

            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(delay)

        raise RuntimeError(f"{model} 임베딩이 {MAX_RETRIES}회 모두 실패했습니다: {last_error}")

    async def _embed_batch(self, texts: list[str], model: str) -> list[list[float]]:
        """프록시 임베딩 호출. 입력 순서대로 벡터를 돌려준다."""
        payload = {
            "model": model,
            "input": texts,
            "dimensions": self.dimensions,
            "encoding_format": "float",
            "meta": build_meta("embed", {"batch": len(texts)}),
        }
        data = await proxy_post("/v1/embeddings", payload, timeout=EMBED_TIMEOUT)

        items = data.get("data") or []
        if len(items) != len(texts):
            raise RuntimeError(
                f"임베딩 개수 불일치: 요청 {len(texts)}건, 응답 {len(items)}건"
            )

        # index가 오면 그 순서를 따르고, 없으면 응답 순서를 그대로 쓴다.
        ordered = sorted(items, key=lambda x: x.get("index", 0))
        vectors = [list(x["embedding"]) for x in ordered]

        for v in vectors:
            if len(v) != self.dimensions:
                raise RuntimeError(
                    f"임베딩 차원 불일치: 기대 {self.dimensions}, 실제 {len(v)}"
                )

        return vectors
