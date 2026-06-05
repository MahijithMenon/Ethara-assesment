from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "Inventory & Order Management API"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = ""

    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/inventory",
        description="SQLAlchemy DSN. Use postgresql+psycopg://... in production.",
    )

    # Stored as a comma-separated string to avoid pydantic-settings' JSON list parser.
    # Use the `cors_origins` property to get the parsed list.
    CORS_ORIGINS: str = "http://localhost:3000"

    LOW_STOCK_THRESHOLD: int = 5

    @field_validator("LOW_STOCK_THRESHOLD")
    @classmethod
    def _validate_low_stock(cls, v: int) -> int:
        if v is None:
            return 5
        if not isinstance(v, int) or v < 0:
            raise ValueError("LOW_STOCK_THRESHOLD must be a non-negative integer")
        return v

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        # Render/Railway/Heroku often hand out "postgres://..." — SQLAlchemy needs "postgresql+psycopg://..."
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+psycopg://", 1)
            elif v.startswith("postgresql://") and "+psycopg" not in v:
                v = v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()