"""Aggregates all v1 endpoint routers. Add one ``include_router`` per resource."""

from fastapi import APIRouter

from app.api.v1.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router)
# Stage 03+: auth, analysis, documents, dashboard, ai_providers, settings, privacy.
