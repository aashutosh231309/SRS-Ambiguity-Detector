"""Analysis + requirement + issue persistence. SQLAlchemy lives here; no rules here.

Ownership arrives from the caller (the service passes the session user id —
never a client-supplied id). Reads are owner-scoped (`get_owned` doubles as
the IDOR guard: no row, no oracle). No commits here: the service's
@transactional boundary owns the transaction.
"""

import uuid
from dataclasses import dataclass
from typing import Any, Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import Analysis
from app.models.issue import Issue
from app.models.requirement import Requirement

SortKey = Literal["created_at", "-created_at", "score", "-score"]


@dataclass(frozen=True)
class RequirementRow:
    """One requirement to insert (service maps `Segment` + engine output →
    this; the column vocabulary stays in one place and no service type leaks
    into this layer)."""

    position: int
    identifier: str | None
    section: str | None
    text: str
    segmentation: dict[str, Any]
    score: int | None = None
    severity: str | None = None
    issues_count: int = 0


@dataclass(frozen=True)
class IssueRow:
    """One issue to insert. `id` is service-generated (uuid4) so the
    analysis `score_breakdown` can reference issues before they are flushed."""

    id: uuid.UUID
    requirement_id: uuid.UUID
    detector_id: str
    category: str
    severity: str
    phrase: str
    start_offset: int
    end_offset: int
    reason: str
    recommendation: str


class AnalysisRepository:
    """`analyses` rows (Stage 07 writes ANALYZED text analyses)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        owner_id: uuid.UUID,
        title: str,
        source_type: str,
        status: str,
        source_text: str,
        source_excerpt: str,
        requirements_count: int,
        issues_count: int,
        score: int | None = None,
        band: str | None = None,
        score_breakdown: dict[str, Any] | None = None,
        health: dict[str, Any] | None = None,
    ) -> Analysis:
        row = Analysis(
            owner_id=owner_id,
            title=title,
            source_type=source_type,
            status=status,
            source_text=source_text,
            source_excerpt=source_excerpt,
            requirements_count=requirements_count,
            issues_count=issues_count,
            score=score,
            band=band,
            score_breakdown=score_breakdown or {},
            health=health,
        )
        self._session.add(row)
        await self._session.flush()  # surfaces constraint violations inside the txn
        # Server-clock timestamps are readable only after a refresh (client time
        # is never trusted — models/base.py), so the service can return them.
        await self._session.refresh(row)
        return row

    async def get_owned(self, *, owner_id: uuid.UUID, analysis_id: uuid.UUID) -> Analysis | None:
        """One analysis iff owned (None covers missing AND foreign — IDOR)."""
        result = await self._session.execute(
            select(Analysis).where(Analysis.id == analysis_id, Analysis.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def list_owned(
        self,
        *,
        owner_id: uuid.UUID,
        offset: int,
        limit: int,
        sort: SortKey,
        band: str | None,
        source_type: str | None,
    ) -> tuple[list[Analysis], int]:
        """Newest-first page of owned analyses + total (contract §3)."""
        filters = [Analysis.owner_id == owner_id]
        if band is not None:
            filters.append(Analysis.band == band)
        if source_type is not None:
            filters.append(Analysis.source_type == source_type)
        total = (
            await self._session.execute(select(func.count()).select_from(Analysis).where(*filters))
        ).scalar_one()
        order: tuple[Any, ...] = {
            "created_at": (Analysis.created_at.asc(), Analysis.id.asc()),
            "-created_at": (Analysis.created_at.desc(), Analysis.id.desc()),
            "score": (Analysis.score.asc(), Analysis.id.asc()),
            "-score": (Analysis.score.desc(), Analysis.id.desc()),
        }[sort]
        result = await self._session.execute(
            select(Analysis).where(*filters).order_by(*order).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def delete(self, row: Analysis) -> None:
        """Delete an owned row (requirements + issues cascade in the DB)."""
        await self._session.delete(row)
        await self._session.flush()


class RequirementRepository:
    """`requirements` rows in extraction order (position 0-based, unique)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_many(
        self,
        *,
        owner_id: uuid.UUID,
        analysis_id: uuid.UUID,
        rows: list[RequirementRow],
    ) -> list[Requirement]:
        inserted = [
            Requirement(
                owner_id=owner_id,
                analysis_id=analysis_id,
                position=item.position,
                identifier=item.identifier,
                section=item.section,
                text=item.text,
                segmentation=item.segmentation,
                score=item.score,
                severity=item.severity,
                issues_count=item.issues_count,
            )
            for item in rows
        ]
        self._session.add_all(inserted)
        await self._session.flush()  # one round-trip; UNIQUE violations abort here
        return inserted

    async def list_for_analysis(self, *, analysis_id: uuid.UUID) -> list[Requirement]:
        result = await self._session.execute(
            select(Requirement)
            .where(Requirement.analysis_id == analysis_id)
            .order_by(Requirement.position.asc())
        )
        return list(result.scalars().all())


class IssueRepository:
    """`issues` rows (Stage 07: detector findings with evidence offsets)."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_many(
        self,
        *,
        owner_id: uuid.UUID,
        analysis_id: uuid.UUID,
        rows: list[IssueRow],
    ) -> list[Issue]:
        inserted = [
            Issue(
                id=item.id,
                owner_id=owner_id,
                requirement_id=item.requirement_id,
                analysis_id=analysis_id,
                detector_id=item.detector_id,
                category=item.category,
                severity=item.severity,
                phrase=item.phrase,
                start_offset=item.start_offset,
                end_offset=item.end_offset,
                reason=item.reason,
                recommendation=item.recommendation,
            )
            for item in rows
        ]
        self._session.add_all(inserted)
        await self._session.flush()
        return inserted

    async def list_for_analysis(self, *, analysis_id: uuid.UUID) -> list[Issue]:
        """Issues in reading order (requirement position, then span). Spans
        are unique per requirement after engine dedup, so this exactly
        restores finding order — no sequence column needed."""
        result = await self._session.execute(
            select(Issue)
            .join(Requirement, Issue.requirement_id == Requirement.id)
            .where(Issue.analysis_id == analysis_id)
            .order_by(
                Requirement.position.asc(),
                Issue.start_offset.asc(),
                Issue.end_offset.asc(),
            )
        )
        return list(result.scalars().all())
