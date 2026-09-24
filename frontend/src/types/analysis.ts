/**
 * Analysis domain types — mirrored from docs/API_CONTRACT.md §4.3
 * (Stage 07: engine-scored `analyzed` rows; pre-Stage-07 `segmented` rows
 * still read back with null scores). Backend: `app/schemas/analysis.py`.
 * Same names, same optionality.
 */

/** Pipeline stage. POST returns `analyzed`; `segmented` is legacy. */
export type AnalysisStatus = "segmented" | "analyzed";

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

/** One detector finding — nested under its requirement (no parent id). */
export interface AnalysisIssue {
  id: string;
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

/** One scored requirement — `severity` is null when no issues fired. */
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

export interface ScoreDeduction {
  issue_id: string;
  severity: RequirementSeverity;
  points: number;
}

/** Transparent breakdown: base + per-issue deductions + severity counts. */
export interface ScoreBreakdown {
  base: number;
  deductions: ScoreDeduction[];
  counts: Record<RequirementSeverity, number>;
}

/** Supplementary dimensions (each 100 − mapped deductions, clamped). */
export interface HealthDimensions {
  clarity: number;
  specificity: number;
  measurability: number;
  completeness: number;
}

/**
 * Analysis detail (POST result + GET by id). Issues live nested per
 * requirement; there is no top-level `issues` and no `source_excerpt`
 * (summary-only) in the detail.
 */
export interface AnalysisResult {
  id: string;
  title: string;
  status: AnalysisStatus;
  source_type: "text";
  score: number | null;
  band: AnalysisBand | null;
  score_breakdown: ScoreBreakdown;
  requirements_count: number;
  issues_count: number;
  health: HealthDimensions | null;
  ai_overview: string | null;
  ai_provider: string | null;
  ai_status: "skipped";
  ai_error: string | null;
  requirements: SegmentedRequirement[];
  created_at: string;
  updated_at: string;
}

/** History-list row: detail minus `requirements`, plus `source_excerpt`. */
export interface AnalysisSummary {
  id: string;
  title: string;
  status: AnalysisStatus;
  source_type: "text";
  source_excerpt: string | null;
  score: number | null;
  band: AnalysisBand | null;
  requirements_count: number;
  issues_count: number;
  created_at: string;
  updated_at: string;
}

export type AnalysisSort = "created_at" | "-created_at" | "score" | "-score";

export interface ListAnalysesParams {
  page?: number;
  page_size?: number;
  sort?: AnalysisSort;
  band?: AnalysisBand;
  source_type?: "text" | "document";
}

export interface CreateAnalysisInput {
  title: string;
  text: string;
}
