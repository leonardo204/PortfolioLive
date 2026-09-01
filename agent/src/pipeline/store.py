import json
from typing import Any
from ..db.connection import get_pool


# 색인 테이블은 두 벌이다(주 모델 / 예비 모델). 테이블명은 SQL에 직접 들어가므로
# 외부 값을 그대로 쓰지 않고 아래 목록에 있는 것만 허용한다.
PRIMARY_TABLE = "embeddings"
FALLBACK_TABLE = "embeddings_fallback"
_ALLOWED_TABLES = (PRIMARY_TABLE, FALLBACK_TABLE)


def _checked_table(table: str) -> str:
    if table not in _ALLOWED_TABLES:
        raise ValueError(f"허용되지 않은 색인 테이블입니다: {table}")
    return table


class PipelineStore:
    """portfolio_projects 및 embeddings 테이블에 데이터를 저장합니다."""

    async def upsert_portfolio_project(self, project: dict[str, Any]) -> int:
        """
        portfolio_projects 테이블에 upsert합니다.
        slug 기준으로 존재하면 업데이트, 없으면 삽입합니다.
        반환값: project id
        """
        pool = await get_pool()

        techs = project.get("technologies", [])
        if isinstance(techs, list):
            techs_arr = techs
        else:
            techs_arr = []

        row = await pool.fetchrow(
            """
            INSERT INTO portfolio_projects (
                slug, title, description, category, technologies,
                year, github_url, readme_raw, readme_raw_en,
                description_en, title_en, last_synced_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5::text[],
                $6, $7, $8, $9, $10, $11, NOW(), NOW()
            )
            ON CONFLICT (slug) DO UPDATE SET
                title          = EXCLUDED.title,
                description    = EXCLUDED.description,
                category       = EXCLUDED.category,
                technologies   = EXCLUDED.technologies,
                year           = EXCLUDED.year,
                github_url     = EXCLUDED.github_url,
                readme_raw     = EXCLUDED.readme_raw,
                readme_raw_en  = EXCLUDED.readme_raw_en,
                -- 영문 메인 README 파싱이 비면(해당 프로젝트 누락 등) 기존값 보존
                description_en = COALESCE(NULLIF(EXCLUDED.description_en, ''), portfolio_projects.description_en),
                title_en       = COALESCE(NULLIF(EXCLUDED.title_en, ''), portfolio_projects.title_en),
                last_synced_at = NOW(),
                updated_at     = NOW()
                -- NOTE: tags, live_url은 sync에서 건드리지 않음 (seed/admin이 소스 오브 트루스)
            RETURNING id
            """,
            project.get("slug", ""),
            project.get("title", project.get("slug", "")),
            project.get("description", ""),
            project.get("category", ""),
            techs_arr,
            project.get("year", ""),
            project.get("github_url", ""),
            project.get("readme_raw", ""),
            project.get("readme_raw_en", None),
            project.get("description_en", None),
            project.get("title_en", None),
        )
        return row["id"]

    async def delete_embeddings_for_source(
        self, source_type: str, source_id: int, table: str = PRIMARY_TABLE
    ) -> None:
        """기존 임베딩 삭제 (재동기화 시 클린업)"""
        table = _checked_table(table)
        pool = await get_pool()
        await pool.execute(
            f"DELETE FROM {table} WHERE source_type = $1 AND source_id = $2",
            source_type,
            source_id,
        )

    async def save_embeddings(
        self,
        chunks: list[dict[str, Any]],
        embeddings: list[list[float]],
        table: str = PRIMARY_TABLE,
    ) -> int:
        """색인 테이블에 벡터와 청크를 함께 저장합니다."""
        table = _checked_table(table)
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Chunks ({len(chunks)}) and embeddings ({len(embeddings)}) count mismatch"
            )

        pool = await get_pool()
        saved = 0

        async with pool.acquire() as conn:
            for chunk, embedding in zip(chunks, embeddings):
                # vector 타입을 문자열로 변환 (asyncpg에는 vector 코덱 없음)
                vec_str = "[" + ",".join(str(v) for v in embedding) + "]"
                metadata_json = json.dumps(chunk.get("metadata", {}))

                await conn.execute(
                    """
                    INSERT INTO {table} (
                        source_type, source_id, section, content,
                        embedding, metadata, chunk_index, total_chunks
                    ) VALUES (
                        $1, $2, $3, $4,
                        $5::vector, $6::jsonb, $7, $8
                    )
                    """.format(table=table),
                    chunk["source_type"],
                    chunk["source_id"],
                    chunk.get("section", ""),
                    chunk["content"],
                    vec_str,
                    metadata_json,
                    chunk.get("chunk_index", 0),
                    chunk.get("total_chunks", 1),
                )
                saved += 1

        return saved
