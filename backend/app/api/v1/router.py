"""Aggregates all v1 endpoint routers. Add one ``include_router`` per resource."""

from fastapi import APIRouter

from app.api.v1.endpoints import analysis, auth, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(analysis.router)
# Later: documents, dashboard, ai_providers, settings, privacy (owning stages).
