import asyncio
from typing import Any
from google import genai
from google.genai import types as genai_types
from ..config import settings

MODEL_NAME = "models/gemini-embedding-001"
BATCH_SIZE = 100
MAX_RETRIES = 3
RETRY_DELAY = 2.0


class Embedder:
    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """
        텍스트 리스트를 Gemini text-embedding-004 모델로 임베딩합니다.
        배치 처리 (최대 BATCH_SIZE개씩)
        """
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i : i + BATCH_SIZE]
            embeddings = await self._embed_batch_with_retry(batch)
            all_embeddings.extend(embeddings)

        return all_embeddings

    async def embed_text(self, text: str) -> list[float]:
        """단일 텍스트 임베딩"""
        results = await self.embed_texts([text])
        return results[0]

    async def _embed_batch_with_retry(self, texts: list[str]) -> list[list[float]]:
        """재시도 로직을 포함한 배치 임베딩"""
        for attempt in range(MAX_RETRIES):
            try:
                return await asyncio.get_event_loop().run_in_executor(
                    None, self._sync_embed_batch, texts
                )
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    print(f"[Embedder] Retry {attempt + 1}/{MAX_RETRIES} after error: {e}")
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
                else:
                    raise

        raise RuntimeError("Embedding failed after retries")

    def _sync_embed_batch(self, texts: list[str]) -> list[list[float]]:
        """동기 배치 임베딩 (executor에서 실행)"""
        embeddings: list[list[float]] = []

        for text in texts:
            response = self._client.models.embed_content(
                model=MODEL_NAME,
                contents=text,
                config=genai_types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=768,
                ),
            )
            vec = response.embeddings[0].values
            embeddings.append(list(vec))

        return embeddings
