"""Analysis business logic (API_CONTRACT §4.3, Stage 06: TEXT only).

Pure of HTTP: takes a session + plain values, returns plain dataclasses (the
router maps them to response schemas). One transaction per call: normalize →
segment → persist analysis + requirements → commit. Nothing is scored here —
score/band stay NULL until the Stage 07 engine; NOTHING is truncated (an
over-long input is refused with counts, never cut).

Logs carry ids + counts only — raw SRS text is NEVER logged (SECURITY_SPEC
§2.5: requirement text is sensitive content).
"""

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.exceptions import (
    DocumentAnalysisUnavailableError,
    NoRequirementsDetectedError,
    TextTooLargeError,
)
from app.repositories.analysis import (
    AnalysisRepository,
    RequirementRepository,
    RequirementRow,
)
from app.services.segmentation import (
    MAX_REQUIREMENTS,
    normalize_text,
    segment_requirements,
)
from app.services.transactions import transactional

logger = get_logger(__name__)

# Deterministic fallback when the client sends no (or a blank) title.
UNTITLED_TITLE = "Untitled SRS Analysis"
# History-list excerpt of the normalized input (contract: ≤500 chars).
SOURCE_EXCERPT_CHARS = 500


@dataclass(frozen=True)
class RequirementDetail:
    """One persisted requirement, JSON-safe (built from the ORM row while the
    session is alive — the router must never touch expired attributes)."""

    id: uuid.UUID
    position: int
    identifier: str | None
    section: str | None
    text: str
    segmentation: dict[str, Any]


@dataclass(frozen=True)
class AnalysisDetail:
    """One persisted SEGMENTED analysis with its requirements in order."""

    id: uuid.UUID
    title: str
    status: str
    source_type: str
    requirements_count: int
    issues_count: int
    created_at: datetime
    updated_at: datetime
    requirements: tuple[RequirementDetail, ...]


@transactional
async def create_text_analysis(
    session: AsyncSession,
    *,
    owner_id: uuid.UUID,
    title: str | None,
    text: str,
    document_id: uuid.UUID | None,
    ai_enhance: bool,
) -> AnalysisDetail:
    """Validate → normalize → segment → persist. Raises AppError (safe codes);
    any failure rolls the transaction back — partial analyses are impossible."""
    _ = ai_enhance  # accepted-and-ignored until Stage 19 (no AI in Stage 06)
    if document_id is not None:
        raise DocumentAnalysisUnavailableError()
    normalized = normalize_text(text)
    if not normalized:
        raise NoRequirementsDetectedError()
    segments = segment_requirements(normalized)
    if not segments:
        raise NoRequirementsDetectedError()
    if len(segments) > MAX_REQUIREMENTS:
        raise TextTooLargeError(len(segments), MAX_REQUIREMENTS)

    analysis = await AnalysisRepository(session).create(
        owner_id=owner_id,
        title=title or UNTITLED_TITLE,
        source_type="text",
        status="segmented",
        source_text=normalized,
        source_excerpt=normalized[:SOURCE_EXCERPT_CHARS],
        requirements_count=len(segments),
        issues_count=0,
    )
    rows = await RequirementRepository(session).create_many(
        owner_id=owner_id,
        analysis_id=analysis.id,
        rows=[
            RequirementRow(
                position=position,
                identifier=segment.identifier,
                section=segment.section,
                text=segment.text,
                segmentation={
                    "strategy": segment.strategy,
                    "confidence": segment.confidence,
                    "start_offset": segment.start_offset,
                    "end_offset": segment.end_offset,
                    "line_start": segment.line_start,
                    "line_end": segment.line_end,
                },
            )
            for position, segment in enumerate(segments)
        ],
    )
    logger.info(
        "analysis created analysis_id=%s owner_id=%s requirements=%d",
        analysis.id,
        owner_id,
        len(segments),
    )
    return AnalysisDetail(
        id=analysis.id,
        title=analysis.title,
        status=analysis.status,
        source_type=analysis.source_type,
        requirements_count=analysis.requirements_count,
        issues_count=analysis.issues_count,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
        requirements=tuple(
            RequirementDetail(
                id=row.id,
                position=row.position,
                identifier=row.identifier,
                section=row.section,
                text=row.text,
                segmentation=dict(row.segmentation or {}),
            )
            for row in rows
        ),
    )
