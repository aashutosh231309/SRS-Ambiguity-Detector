"""Centralized, env-driven settings (ADR: no stray ``os.getenv`` in feature code).

Every setting is validated at boot. See ``backend/.env.example`` for the full matrix
and ``docs/ARCHITECTURE.md`` §7 for the stage-by-stage breakdown.
"""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings. Instantiate via :func:`get_settings` (cached)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "SRS Ambiguity Detector"
    APP_ENV: Literal["local", "staging", "production"] = "local"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"

    # Exact origins, e.g. "https://app.example.com,https://www.example.com".
    # Accepts a JSON list OR a comma-separated string.
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Stage 02+: required in staging/production, optional for the skeleton.
    DATABASE_URL: str | None = None

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                return value  # let pydantic-settings parse JSON
            return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
