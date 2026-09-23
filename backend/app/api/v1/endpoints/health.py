"""Liveness + readiness probes (``docs/API_CONTRACT.md`` §4.1). No auth."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app import __version__
from app.core.database import database_status

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

    `database` is a live `SELECT 1` when `DATABASE_URL` is set (`not_configured`
    otherwise); any connectivity failure flips the probe to `degraded`.
    Never exposes connection details.
    """
    db = await database_status()
    status: Literal["ready", "degraded"] = "degraded" if db == "error" else "ready"
    return ReadyResponse(status=status, checks={"database": db})
