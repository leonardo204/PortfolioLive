"""RAG 벡터 검색.

색인은 두 벌이다. 주 모델로 만든 색인에서 검색하고, 주 모델이 막혀 예비 모델로
질의를 임베딩했다면 예비 색인에서 검색한다. 두 모델은 벡터 공간이 달라 섞어 쓰면
유사도가 어긋나므로, 질의를 만든 모델과 같은 색인만 본다.
"""

import json
import logging
from typing import Any

from ..config import settings
from ..db.connection import get_pool
from ..pipeline.embedder import Embedder

logger = logging.getLogger(__name__)

# 모델 → (색인 테이블, 충분도 판정 기준). 테이블명은 SQL에 직접 넣으므로
# 외부 입력이 아닌 이 표에서만 가져온다.
PRIMARY_TABLE = "embeddings"
FALLBACK_TABLE = "embeddings_fallback"


class RAGRetriever:
    """pgvector 코사인 유사도 검색을 수행합니다."""

    def __init__(self) -> None:
        self.embedder = Embedder()

    async def search(self, query: str, top_k: int = 5) -> tuple[list[dict[str, Any]], float]:
        """쿼리를 임베딩해 pgvector에서 유사도 검색합니다.

        Returns:
            (검색 결과 top_k개, 이 결과에 적용할 충분도 기준)
        """
        query_embedding, model = await self.embedder.embed_query(query)

        if model == self.embedder.model:
            table = PRIMARY_TABLE
            threshold = settings.rag_min_similarity
        else:
            table = FALLBACK_TABLE
            threshold = settings.rag_min_similarity_fallback
            logger.info(f"[RAG] 예비 색인({table})에서 검색합니다.")

        vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"
        pool = await get_pool()

        rows = await pool.fetch(
            f"""
            SELECT
                id, source_type, source_id, section, content,
                metadata, chunk_index, total_chunks, created_at,
                1 - (embedding <=> $1::vector) AS similarity
            FROM {table}
            ORDER BY embedding <=> $1::vector
            LIMIT $2
            """,
            vec_str,
            top_k,
        )

        results = []
        for row in rows:
            meta = row["metadata"]
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except Exception:
                    meta = {}

            results.append({
                "id": row["id"],
                "source_type": row["source_type"],
                "source_id": row["source_id"],
                "section": row["section"],
                "content": row["content"],
                "metadata": meta,
                "chunk_index": row["chunk_index"],
                "total_chunks": row["total_chunks"],
                "similarity": float(row["similarity"]),
            })

        return results, threshold
