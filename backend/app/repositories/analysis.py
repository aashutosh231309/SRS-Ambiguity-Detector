"""Analysis + requirement persistence. SQLAlchemy lives here; no rules here.

Ownership arrives from the caller (the service passes the session user id —
never a client-supplied id). No commits here: the service's @transactional
boundary owns the transaction.
"""

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import Analysis
from app.models.requirement import Requirement


@dataclass(frozen=True)
class RequirementRow:
    """One requirement to insert (service maps `Segment` → this; the column
    vocabulary stays in one place and no service type leaks into this layer)."""

    position: int
    identifier: str | None
    section: str | None
    text: str
    segmentation: dict[str, Any]


class AnalysisRepository:
    """`analyses` rows (Stage 06 writes SEGMENTED text analyses only)."""

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
        )
        self._session.add(row)
        await self._session.flush()  # surfaces constraint violations inside the txn
        # Server-clock timestamps are readable only after a refresh (client time
        # is never trusted — models/base.py), so the service can return them.
        await self._session.refresh(row)
        return row


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
            )
            for item in rows
        ]
        self._session.add_all(inserted)
        await self._session.flush()  # one round-trip; UNIQUE violations abort here
        return inserted
