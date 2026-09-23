"""Liveness + readiness probes (``docs/API_CONTRACT.md`` §4.1). No auth."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app import __version__
from app.core.config import get_settings

router = APIRouter(prefix="/health", tags=["health"])


class LiveResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str = "srs-ambiguity-detector"
    version: str = __version__


class ReadyResponse(BaseModel):
    status: Literal["ready", "degraded"] = "ready"
    checks: dict[str, str] = {}


@router.get("/live", response_model=LiveResponse)
async def live() -> LiveResponse:
    """Process is up. Used by the frontend status card and orchestrators."""
    return LiveResponse()


@router.get("/ready", response_model=ReadyResponse)
async def ready() -> ReadyResponse:
    """Dependencies reachable.

    Stage 01: the skeleton has no required dependencies, so it reports ``ready``
    with ``database: not_configured``. Stage 02 turns this into a real connection
    check (``ok`` / ``error``) and flips ``status`` to ``degraded`` on failure.
    """
    settings = get_settings()
    checks = {"database": "ok" if settings.DATABASE_URL else "not_configured"}
    return ReadyResponse(status="ready", checks=checks)
