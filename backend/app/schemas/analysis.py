"""Analysis API boundary models (API_CONTRACT §4.3 — Stage 06 subset).

Stage 06 serves TEXT input only: `document_id` is accepted-but-rejected (400
until the Stage 09 upload pipeline exists) and `options.ai_enhance` is
accepted-and-ignored until Stage 19 (same posture as Stage 04's
`turnstile_token`). Scores are NULL until the Stage 07 detection engine —
never fabricated.
"""

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

TITLE_MAX_LENGTH = 200  # mirrors analyses.title VARCHAR(200)
TEXT_MAX_LENGTH = 200_000  # contract §4.3: chars, enforced by the schema (400)


class AnalysisOptions(BaseModel):
    ai_enhance: bool = False


class AnalysisCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=TITLE_MAX_LENGTH)
    text: str = Field(min_length=1, max_length=TEXT_MAX_LENGTH)
    document_id: uuid.UUID | None = None
    options: AnalysisOptions = Field(default_factory=AnalysisOptions)

    @field_validator("title")
    @classmethod
    def _strip_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None  # blank → service fallback title

    @field_validator("text")
    @classmethod
    def _reject_blank_text(cls, value: str) -> str:
        # Whitespace-only input is a FIELD error (400 validation_error with a
        # `text` loc the UI maps to the editor) — not an attempted analysis.
        # The service still owns normalization; this only classifies blankness.
        if not value.strip():
            raise ValueError("text must not be blank")
        return value


class SegmentationMetaResponse(BaseModel):
    """How one requirement was segmented (evidence for the Stage 07 engine)."""

    strategy: str
    confidence: float
    start_offset: int
    end_offset: int
    line_start: int
    line_end: int


class RequirementResponse(BaseModel):
    """One segmented requirement — unscored until Stage 07 (score/severity/
    rewrite all NULL; `issues_count` 0; `issues` nested-empty per the binding
    §4.3 example; `segmentation` always present)."""

    id: uuid.UUID
    position: int
    identifier: str | None
    section: str | None = None
    text: str
    score: int | None = None
    severity: str | None = None
    issues_count: int = 0
    suggested_rewrite: str | None = None
    suggestion_source: str | None = None
    segmentation: SegmentationMetaResponse
    issues: list[Any] = Field(default_factory=list)  # IssueResponse lands Stage 07


class AnalysisDetailResponse(BaseModel):
    """POST /analysis result (contract §4.3 detail, Stage 06 amendment:
    `status` added; `score`/`band` NULL pre-detection; every requirement
    carries `section` + `segmentation` with nested-empty `issues`. No
    top-level `issues` (nested-only per the §4.3 example) and no
    `source_excerpt` (summary-only per the §4.3 definition)."""

    id: uuid.UUID
    title: str
    status: Literal["segmented"]
    source_type: Literal["text"]
    score: int | None = None
    band: str | None = None
    score_breakdown: dict[str, Any] = Field(default_factory=dict)
    requirements_count: int
    issues_count: int
    health: dict[str, Any] | None = None
    ai_overview: str | None = None
    ai_provider: str | None = None
    ai_status: Literal["skipped"] = "skipped"
    ai_error: str | None = None
    requirements: list[RequirementResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
