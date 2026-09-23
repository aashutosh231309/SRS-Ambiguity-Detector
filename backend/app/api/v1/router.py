"""Aggregates all v1 endpoint routers. Add one ``include_router`` per resource."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
# Stage 07+: analysis, documents, dashboard, ai_providers, settings, privacy.
