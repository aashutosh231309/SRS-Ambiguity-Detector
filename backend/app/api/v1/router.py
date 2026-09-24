"""Aggregates all v1 endpoint routers. Add one ``include_router`` per resource."""

from fastapi import APIRouter

from app.api.v1.endpoints import analysis, auth, dashboard, documents, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(analysis.router)
api_router.include_router(documents.router)
api_router.include_router(dashboard.router)
# Later: ai_providers, settings, privacy (owning stages).
