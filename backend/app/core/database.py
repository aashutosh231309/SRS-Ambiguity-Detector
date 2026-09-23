"""Async PostgreSQL engine + session factory (SQLAlchemy 2.0 + asyncpg).

DSN handling rules (SECURITY_SPEC): the URL is accepted from `DATABASE_URL` only,
never logged, never returned, never echoed in errors — exception chains that could
carry it are deliberately suppressed (`from None`).

Stage 03 wires `get_session` into routes and adds lifespan shutdown; until then the
only consumer is the `/ready` probe plus tests.
"""

from collections.abc import AsyncGenerator
from typing import Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def normalize_url(raw: str) -> str:
    """Coerce `postgresql://` / `postgres://` to the asyncpg driver URL.

    Raises RuntimeError (value withheld) for anything else — non-Postgres URLs are
    rejected loudly so nothing can silently run on the wrong engine.
    """
    if raw.startswith("postgresql+asyncpg://"):
        return raw
    for prefix in ("postgresql://", "postgres://"):
        if raw.startswith(prefix):
            return "postgresql+asyncpg://" + raw[len(prefix) :]
    raise RuntimeError(
        "DATABASE_URL must use the postgresql:// scheme (see backend/.env.example). "
        "Value withheld."
    )


def get_engine() -> AsyncEngine:
    """Process-wide lazy engine (pool_pre_ping: stale pooled conns are recycled)."""
    global _engine, _session_factory
    if _engine is not None:
        return _engine
    raw_url = get_settings().DATABASE_URL
    if not raw_url:
        raise RuntimeError("DATABASE_URL is not configured (see backend/.env.example).")
    try:
        _engine = create_async_engine(normalize_url(raw_url), pool_pre_ping=True)
    except Exception:
        # from None: SQLAlchemy parse errors echo the URL — must not reach tracebacks.
        raise RuntimeError("Invalid DATABASE_URL (see backend/.env.example).") from None
    _session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Session factory bound to the process engine (expire_on_commit=False)."""
    get_engine()
    assert _session_factory is not None  # get_engine() always sets both together
    return _session_factory


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding one session per request (routes from Stage 03)."""
    factory = get_session_factory()
    async with factory() as session:
        yield session


async def database_status() -> Literal["not_configured", "ok", "error"]:
    """Truthful reachability probe for `/ready`. Never raises, never leaks the DSN."""
    try:
        engine = get_engine()
    except RuntimeError:
        return "not_configured"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return "ok"
    except Exception:
        logger.warning("Database reachability check failed (details withheld).")
        return "error"


async def dispose_engine() -> None:
    """Dispose + forget the cached engine (tests; Stage 03 lifespan shutdown)."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None
