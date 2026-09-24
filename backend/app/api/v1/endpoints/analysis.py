"""Analysis endpoints (API_CONTRACT §4.3 — Stage 07: create + read + delete).

Thin: guards (verified identity; CSRF + per-user rate limit on POST, CSRF +
default bucket on DELETE, identity-only on safe GETs) → service → response.
Reads are owner-scoped: foreign ids 404 exactly like missing ones (IDOR rule).
"""

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_current_verified_user, verified_user_guard
from app.core.config import get_settings
from app.core.database import get_session
from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisDetailResponse,
    AnalysisSummaryResponse,
    IssueResponse,
    RequirementResponse,
    SegmentationMetaResponse,
)
from app.schemas.common import Page, PaginationParams
from app.services import analysis as analysis_service
from app.services.analysis import (
    AnalysisDetail,
    AnalysisSummary,
    IssueDetail,
    RequirementDetail,
)
from app.services.auth import UserInfo

router = APIRouter(prefix="/analysis", tags=["analysis"])

# Guard is built once; the budget lambda resolves per-request (never frozen).
create_guard = verified_user_guard(
    "analysis:create", limit=lambda: get_settings().RATE_LIMIT_ANALYSIS_PER_MINUTE
)
delete_guard = verified_user_guard("analysis:delete")

SortParam = Literal["created_at", "-created_at", "score", "-score"]
BandParam = Literal["low", "moderate", "high", "very_high"]
SourceTypeParam = Literal["text", "document"]


def _issue_response(item: IssueDetail) -> IssueResponse:
    return IssueResponse(
        id=item.id,
        detector_id=item.detector_id,
        category=item.category,
        severity=item.severity,
        phrase=item.phrase,
        start_offset=item.start_offset,
        end_offset=item.end_offset,
        reason=item.reason,
        recommendation=item.recommendation,
        ai_explanation=item.ai_explanation,
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
        score=item.score,
        severity=item.severity,
        issues_count=item.issues_count,
        suggested_rewrite=item.suggested_rewrite,
        suggestion_source=item.suggestion_source,
        segmentation=SegmentationMetaResponse(
            strategy=meta["strategy"],
            confidence=meta["confidence"],
            start_offset=meta["start_offset"],
            end_offset=meta["end_offset"],
            line_start=meta["line_start"],
            line_end=meta["line_end"],
        ),
        issues=[_issue_response(issue) for issue in item.issues],
    )


def _detail_response(detail: AnalysisDetail) -> AnalysisDetailResponse:
    if detail.status not in ("segmented", "analyzed"):
        raise ValueError(f"unexpected analysis status: {detail.status!r}")
    return AnalysisDetailResponse(
        id=detail.id,
        title=detail.title,
        status=detail.status,  # type: ignore[arg-type]  # narrowed above
        source_type="text",
        score=detail.score,
        band=detail.band,
        score_breakdown=detail.score_breakdown,
        requirements_count=detail.requirements_count,
        issues_count=detail.issues_count,
        health=detail.health,
        requirements=[_requirement_response(item) for item in detail.requirements],
        created_at=detail.created_at,
        updated_at=detail.updated_at,
    )


def _summary_response(item: AnalysisSummary) -> AnalysisSummaryResponse:
    if item.status not in ("segmented", "analyzed"):
        raise ValueError(f"unexpected analysis status: {item.status!r}")
    return AnalysisSummaryResponse(
        id=item.id,
        title=item.title,
        status=item.status,  # type: ignore[arg-type]  # narrowed above
        source_type="text",
        source_excerpt=item.source_excerpt,
        score=item.score,
        band=item.band,
        requirements_count=item.requirements_count,
        issues_count=item.issues_count,
        created_at=item.created_at,
        updated_at=item.updated_at,
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


@router.get("", response_model=Page[AnalysisSummaryResponse])
async def list_analyses(
    user: Annotated[UserInfo, Depends(get_current_verified_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    paging: Annotated[PaginationParams, Depends()],
    sort: Annotated[SortParam, Query()] = "-created_at",
    band: Annotated[BandParam | None, Query()] = None,
    source_type: Annotated[SourceTypeParam | None, Query()] = None,
) -> Page[AnalysisSummaryResponse]:
    """Newest-first page of owned analyses (contract §3; unknown params are
    ignored by FastAPI, `q`/`category`/`severity` arrive with history search)."""
    items, total = await analysis_service.list_analyses(
        session,
        owner_id=user.id,
        page=paging.page,
        page_size=paging.page_size,
        sort=sort,
        band=band,
        source_type=source_type,
    )
    return Page[AnalysisSummaryResponse](
        items=[_summary_response(item) for item in items],
        page=paging.page,
        page_size=paging.page_size,
        total=total,
    )


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse)
async def get_analysis(
    analysis_id: UUID,
    user: Annotated[UserInfo, Depends(get_current_verified_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AnalysisDetailResponse:
    detail = await analysis_service.get_analysis_detail(
        session, owner_id=user.id, analysis_id=analysis_id
    )
    return _detail_response(detail)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: UUID,
    user: Annotated[UserInfo, Depends(delete_guard)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    await analysis_service.delete_analysis(session, owner_id=user.id, analysis_id=analysis_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
