import asyncpg
from typing import Optional
from ..config import settings

_pool: Optional[asyncpg.Pool] = None


def _build_dsn() -> str:
    url = settings.effective_database_url
    # asyncpg uses postgresql:// or postgres://
    if url.startswith("postgresql://"):
        return url
    if url.startswith("postgres://"):
        return url
    # fallback: build from parts
    return (
        f"postgresql://{settings.postgres_user}:{settings.postgres_password}"
        f"@localhost:{settings.postgres_port}/{settings.postgres_db}"
    )


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        dsn = _build_dsn()
        _pool = await asyncpg.create_pool(dsn=dsn, min_size=2, max_size=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
