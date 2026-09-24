/**
 * Analysis domain types — mirrored from docs/API_CONTRACT.md §4.3
 * (Stage 06: TEXT segmentation; `score`/`band`/`issues` stay null/empty until
 * the Stage 07 detection engine fills them). Backend: `app/schemas/analysis.py`.
 * Same names, same optionality.
 */

/** Pipeline stage. `"segmented"` is the only Stage 06 value. */
export type AnalysisStatus = "segmented";

/** How one requirement was detected (segmentation evidence, not a score). */
export type SegmentationStrategy =
  "requirement_id" | "decimal" | "numbered" | "bullet" | "paragraph";

export interface SegmentationMeta {
  strategy: SegmentationStrategy;
  confidence: number;
  start_offset: number;
  end_offset: number;
  line_start: number;
  line_end: number;
}

export type RequirementSeverity = "low" | "medium" | "high" | "critical";

/** One segmented requirement — unscored until Stage 07 (`issues` nested-empty). */
export interface SegmentedRequirement {
  id: string;
  position: number;
  identifier: string | null;
  section: string | null;
  text: string;
  score: number | null;
  severity: RequirementSeverity | null;
  issues_count: number;
  suggested_rewrite: string | null;
  suggestion_source: string | null;
  segmentation: SegmentationMeta;
  issues: AnalysisIssue[];
}

export type AnalysisBand = "low" | "moderate" | "high" | "very_high";

/**
 * Per-requirement finding — shape reserved from the contract; Stage 06
 * analyses always return `issues: []` (detectors land in Stage 07).
 */
export interface AnalysisIssue {
  id: string;
  requirement_id: string;
  detector_id: string;
  category: string;
  severity: RequirementSeverity;
  phrase: string;
  start_offset: number;
  end_offset: number;
  reason: string;
  recommendation: string;
  ai_explanation: string | null;
}

/**
 * POST /analysis result (contract §4.3 detail, Stage 06 amendment).
 * Issues live nested per requirement (always `[]` pre-detection); there is no
 * top-level `issues` and no `source_excerpt` (summary-only) in the detail.
 */
export interface AnalysisResult {
  id: string;
  title: string;
  status: AnalysisStatus;
  source_type: "text";
  score: number | null;
  band: AnalysisBand | null;
  score_breakdown: Record<string, unknown>;
  requirements_count: number;
  issues_count: number;
  health: Record<string, unknown> | null;
  ai_overview: string | null;
  ai_provider: string | null;
  ai_status: "skipped";
  ai_error: string | null;
  requirements: SegmentedRequirement[];
  created_at: string;
  updated_at: string;
}

export interface CreateAnalysisInput {
  title: string;
  text: string;
}
