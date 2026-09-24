"""Analysis endpoints (API_CONTRACT §4.3 — Stage 06: TEXT creation only).

Thin: verified-user guard (verified identity + CSRF + per-user rate limit) →
service (validate → normalize → segment → persist) → response. History/report
routes (`GET`, `DELETE`) land with their owning stages — nothing here returns
scores, severities, or AI text because Stage 06 computes none of those.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import verified_user_guard
from app.core.config import get_settings
from app.core.database import get_session
from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisDetailResponse,
    RequirementResponse,
    SegmentationMetaResponse,
)
from app.services import analysis as analysis_service
from app.services.analysis import AnalysisDetail, RequirementDetail
from app.services.auth import UserInfo

router = APIRouter(prefix="/analysis", tags=["analysis"])

# Guard is built once; the budget lambda resolves per-request (never frozen).
create_guard = verified_user_guard(
    "analysis:create", limit=lambda: get_settings().RATE_LIMIT_ANALYSIS_PER_MINUTE
)


def _requirement_response(item: RequirementDetail) -> RequirementResponse:
    # `segmentation` is service-built (fixed keys, JSON-safe values); Pydantic
    # re-validates every value on the way out — a drift would 500, never lie.
    meta = item.segmentation
    return RequirementResponse(
        id=item.id,
        position=item.position,
        identifier=item.identifier,
        section=item.section,
        text=item.text,
        segmentation=SegmentationMetaResponse(
            strategy=meta["strategy"],
            confidence=meta["confidence"],
            start_offset=meta["start_offset"],
            end_offset=meta["end_offset"],
            line_start=meta["line_start"],
            line_end=meta["line_end"],
        ),
    )


def _detail_response(detail: AnalysisDetail) -> AnalysisDetailResponse:
    return AnalysisDetailResponse(
        id=detail.id,
        title=detail.title,
        status="segmented",  # Literal: fail closed if the service ever drifts
        source_type="text",
        requirements_count=detail.requirements_count,
        issues_count=detail.issues_count,
        created_at=detail.created_at,
        updated_at=detail.updated_at,
        requirements=[_requirement_response(item) for item in detail.requirements],
    )


@router.post("", response_model=AnalysisDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    body: AnalysisCreateRequest,
    user: Annotated[UserInfo, Depends(create_guard)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AnalysisDetailResponse:
    detail = await analysis_service.create_text_analysis(
        session,
        owner_id=user.id,
        title=body.title,
        text=body.text,
        document_id=body.document_id,
        ai_enhance=body.options.ai_enhance,
    )
    return _detail_response(detail)
