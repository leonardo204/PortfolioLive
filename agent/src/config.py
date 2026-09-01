from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str = ""
    postgres_db: str = "portfoliolive"
    postgres_user: str = "portfoliolive"
    postgres_password: str = ""
    postgres_port: int = 5433

    # AI 프록시 (ai.zerolive.co.kr) — LLM·임베딩 호출은 전부 여기를 거친다.
    # 토큰은 .env에만 두고 커밋하지 않는다.
    ai_proxy_url: str = "https://ai.zerolive.co.kr"
    ai_proxy_token: str = ""
    ai_embedding_model: str = "google/gemini-embedding-001"
    ai_embedding_dimensions: int = 768
    # 주 임베딩 모델은 검색 품질이 가장 좋지만, 상류(OpenRouter↔Vertex)의 공용 분당
    # 쿼터가 차면 429가 난다. 그때는 아래 모델로 만든 예비 색인에서 검색한다.
    ai_embedding_fallback_model: str = "openai/text-embedding-3-large"

    # RAG 충분도 판정 기준. 모델마다 유사도 분포가 달라 따로 둔다.
    # 값은 포트폴리오 범위 안/밖 질문의 유사도를 실측해 분리점으로 정했다.
    rag_min_similarity: float = 0.63
    rag_min_similarity_fallback: float = 0.44
    rag_min_results: int = 2

    # GitHub
    github_token: str = ""
    github_webhook_secret: str = ""

    # Admin
    admin_password: str = ""

    # SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from_email: str = ""
    admin_email: str = ""

    # App
    agent_port: int = 3101

    @property
    def effective_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@localhost:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
