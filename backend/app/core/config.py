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

    # Stage 02+: DATABASE_URL drives the app; DIRECT_DATABASE_URL (optional, falls
    # back to DATABASE_URL) drives Alembic — on Supabase it bypasses the pooler,
    # which cannot run DDL in transaction-pooling mode.
    DATABASE_URL: str | None = None
    DIRECT_DATABASE_URL: str | None = None

    # --- Stage 04: authentication ---
    # JWT_SECRET signs access tokens (HS256, 256-bit minimum). REQUIRED for any
    # auth endpoint — fail closed (RuntimeError on first use, never a default).
    JWT_SECRET: str | None = None
    ACCESS_TOKEN_MINUTES: int = 15
    REFRESH_TOKEN_DAYS: int = 30
    EMAIL_VERIFICATION_HOURS: int = 24
    PASSWORD_RESET_MINUTES: int = 60
    # resend | console. console = dev-only (metadata logs + full mail to
    # DEV_OUTBOX_DIR, refused in production); resend = Resend HTTP API.
    EMAIL_PROVIDER: Literal["resend", "console"] = "console"
    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "SRS Ambiguity Detector <noreply@example.com>"
    # Public base URL used to build emailed links (verify/reset).
    APP_BASE_URL: str = "http://localhost:3000"
    DEV_OUTBOX_DIR: str = "./.dev-outbox"
    # Auth rate limits (single-process token buckets; Stage 22 distributes).
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_AUTH_PER_MINUTE: int = 60
    # --- Stage 06: analysis creation budget (per verified user per minute) ---
    RATE_LIMIT_ANALYSIS_PER_MINUTE: int = 20
    # --- Stage 08: secure document upload + extraction (SECURITY_SPEC §5) ---
    # Uploads are resource-intensive: tighter per-user budget than text posts.
    RATE_LIMIT_UPLOADS_PER_MINUTE: int = 10
    # Per-file byte cap (streaming-enforced; the true byte count, never the
    # client-declared size). 10 MiB holds very large SRS documents.
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024
    # Extracted-text char cap. Equals the TEXT pipeline budget (TEXT_MAX_LENGTH)
    # so extracted text flows into the SAME segmentation/engine path unmodified.
    MAX_EXTRACTED_TEXT_CHARS: int = 200_000
    # Files per upload request. 1: the sync pipeline analyzes one file per call
    # (bounded request; the endpoint signature enforces this structurally).
    MAX_FILES_PER_REQUEST: int = 1
    # Wall-clock budget for validate+extract (worker thread; the request fails
    # 503 past this — the temp file is still always cleaned up).
    DOCUMENT_PROCESSING_TIMEOUT_SECONDS: int = 60
    # Storage backend: local dev dir now; `supabase` arrives with prod stages.
    STORAGE_BACKEND: Literal["local"] = "local"
    STORAGE_LOCAL_DIR: str = "./uploads"
    # argon2id work factors. Tests override via env (fast-but-real params).
    ARGON2_TIME_COST: int = 3
    ARGON2_MEMORY_COST: int = 65536
    ARGON2_PARALLELISM: int = 4

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                return value  # let pydantic-settings parse JSON
            return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]
        return value

    @field_validator("JWT_SECRET")
    @classmethod
    def _jwt_secret_strength(cls, value: str | None) -> str | None:
        if value is not None and len(value.encode("utf-8")) < 32:
            raise ValueError("JWT_SECRET must be at least 32 bytes (256 bits).")
        return value

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
