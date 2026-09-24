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
from app.api.v1.presenters import detail_response, summary_response
from app.core.config import get_settings
from app.core.database import get_session
from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisDetailResponse,
    AnalysisSummaryResponse,
)
from app.schemas.common import Page, PaginationParams
from app.services import analysis as analysis_service
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


# Service→response mapping lives in `presenters` (shared with the documents
# router — TEXT and DOCUMENT details are identical by construction).


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
    return detail_response(detail)


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
        items=[summary_response(item) for item in items],
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
    return detail_response(detail)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: UUID,
    user: Annotated[UserInfo, Depends(delete_guard)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    await analysis_service.delete_analysis(session, owner_id=user.id, analysis_id=analysis_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
