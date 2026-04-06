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

    # Gemini
    gemini_api_key: str = ""

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
