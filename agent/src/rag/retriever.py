import json
from typing import Any
from ..db.connection import get_pool
from ..pipeline.embedder import Embedder


class RAGRetriever:
    """pgvector 코사인 유사도 검색을 수행합니다."""

    def __init__(self) -> None:
        self.embedder = Embedder()

    async def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """
        쿼리 텍스트를 임베딩하여 pgvector에서 유사도 검색합니다.
        top_k개의 결과를 반환합니다.
        """
        # 쿼리 임베딩
        query_embedding = await self.embedder.embed_text(query)
        vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

        pool = await get_pool()

        rows = await pool.fetch(
            """
            SELECT
                id,
                source_type,
                source_id,
                section,
                content,
                metadata,
                chunk_index,
                total_chunks,
                created_at,
                1 - (embedding <=> $1::vector) AS similarity
            FROM embeddings
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

        return results
