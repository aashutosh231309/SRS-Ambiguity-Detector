"""Service dataclasses → response schemas (ONE mapping, every router).

Stage 08 added a second producer of analysis details (document upload) — these
mappers moved here from `endpoints/analysis.py` so TEXT and DOCUMENT responses
are byte-identical by construction, not by parallel maintenance. Pydantic
re-validates every value on the way out: service/DB drift 500s, never lies.
"""

from app.schemas.analysis import (
    AnalysisDetailResponse,
    AnalysisSummaryResponse,
    DocumentRefResponse,
    IssueResponse,
    RequirementResponse,
    SegmentationMetaResponse,
)
from app.services.analysis import (
    AnalysisDetail,
    AnalysisSummary,
    DocumentRef,
    IssueDetail,
    RequirementDetail,
)

_VALID_STATUSES = ("segmented", "analyzed", "failed")
_VALID_SOURCE_TYPES = ("text", "document")


def _document_response(doc: DocumentRef | None) -> DocumentRefResponse | None:
    """Shared detail/summary pointer mapping (Stage 10): absent degrades to
    None upstream; a present-but-unexpected type 500s (drift never lies)."""
    if doc is None:
        return None
    if doc.file_type not in ("pdf", "docx", "txt"):
        raise ValueError(f"unexpected file type: {doc.file_type!r}")
    return DocumentRefResponse(
        filename=doc.filename,
        file_type=doc.file_type,  # type: ignore[arg-type]  # narrowed above
    )


def issue_response(item: IssueDetail) -> IssueResponse:
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


def requirement_response(item: RequirementDetail) -> RequirementResponse:
    # `segmentation` is service-built (fixed keys, JSON-safe values).
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
        issues=[issue_response(issue) for issue in item.issues],
    )


def detail_response(detail: AnalysisDetail) -> AnalysisDetailResponse:
    if detail.status not in _VALID_STATUSES:
        raise ValueError(f"unexpected analysis status: {detail.status!r}")
    if detail.source_type not in _VALID_SOURCE_TYPES:
        raise ValueError(f"unexpected source type: {detail.source_type!r}")
    document = _document_response(detail.document)
    return AnalysisDetailResponse(
        id=detail.id,
        title=detail.title,
        document=document,
        status=detail.status,  # type: ignore[arg-type]  # narrowed above
        source_type=detail.source_type,  # type: ignore[arg-type]  # narrowed above
        score=detail.score,
        band=detail.band,
        score_breakdown=detail.score_breakdown,
        requirements_count=detail.requirements_count,
        issues_count=detail.issues_count,
        health=detail.health,
        requirements=[requirement_response(item) for item in detail.requirements],
        created_at=detail.created_at,
        updated_at=detail.updated_at,
    )


def summary_response(item: AnalysisSummary) -> AnalysisSummaryResponse:
    if item.status not in _VALID_STATUSES:
        raise ValueError(f"unexpected analysis status: {item.status!r}")
    if item.source_type not in _VALID_SOURCE_TYPES:
        raise ValueError(f"unexpected source type: {item.source_type!r}")
    return AnalysisSummaryResponse(
        id=item.id,
        title=item.title,
        status=item.status,  # type: ignore[arg-type]  # narrowed above
        source_type=item.source_type,  # type: ignore[arg-type]  # narrowed above
        document=_document_response(item.document),
        source_excerpt=item.source_excerpt,
        score=item.score,
        band=item.band,
        requirements_count=item.requirements_count,
        issues_count=item.issues_count,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )
