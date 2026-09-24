// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AnalysisResult } from "@/types/analysis";

import { AnalysisResultView } from "./AnalysisResultView";

function result(): AnalysisResult {
  return {
    id: "analysis-1",
    title: "Login SRS",
    status: "analyzed",
    source_type: "text",
    score: 85,
    band: "low",
    score_breakdown: {
      base: 100,
      deductions: [{ issue_id: "issue-1", severity: "high", points: 15 }],
      counts: { low: 0, medium: 0, high: 1, critical: 0 },
    },
    requirements_count: 2,
    issues_count: 1,
    health: { measurability: 90, specificity: 100, clarity: 100, completeness: 100 },
    ai_overview: null,
    ai_provider: null,
    ai_status: "skipped",
    ai_error: null,
    requirements: [
      {
        id: "req-1",
        position: 0,
        identifier: "FR-001",
        section: null,
        text: "The service should be fast.",
        score: 70,
        severity: "high",
        issues_count: 1,
        suggested_rewrite: null,
        suggestion_source: null,
        segmentation: {
          strategy: "requirement_id",
          confidence: 0.95,
          start_offset: 0,
          end_offset: 27,
          line_start: 1,
          line_end: 1,
        },
        issues: [
          {
            id: "issue-1",
            detector_id: "subjective-term",
            category: "Subjective term",
            severity: "high",
            phrase: "fast",
            start_offset: 22,
            end_offset: 26,
            reason: "“fast” means different response times to different reviewers.",
            recommendation: "State the response time in milliseconds.",
            ai_explanation: null,
          },
        ],
      },
      {
        id: "req-2",
        position: 1,
        identifier: "FR-002",
        section: null,
        text: "The system shall allow login.",
        score: 100,
        severity: null,
        issues_count: 0,
        suggested_rewrite: null,
        suggestion_source: null,
        segmentation: {
          strategy: "requirement_id",
          confidence: 0.95,
          start_offset: 28,
          end_offset: 57,
          line_start: 2,
          line_end: 2,
        },
        issues: [],
      },
    ],
    created_at: "2026-09-24T00:00:00Z",
    updated_at: "2026-09-24T00:00:00Z",
  };
}

afterEach(() => {
  cleanup();
});

describe("AnalysisResultView", () => {
  it("renders counts, score, severity grid, honesty footnote, and both cards", () => {
    const { container } = render(<AnalysisResultView result={result()} onReset={() => {}} />);

    expect(screen.getByText("Analysis complete · 2 requirements · 1 issue")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Login SRS" })).toBeDefined();
    expect(
      screen.getByRole("img", { name: "Ambiguity score 85 out of 100, low ambiguity" }),
    ).toBeDefined();

    // Requirements, issues, then low/medium/high/critical counts in order.
    const values = [...container.querySelectorAll("dd")].map((dd) => dd.textContent);
    expect(values).toEqual(["2", "1", "0", "0", "1", "0"]);

    expect(screen.getByText(/transparent heuristic indicator/)).toBeDefined();
    // The first requirement's text is split by a <mark> — assert on full content.
    expect(container.querySelector("ol")?.textContent).toContain("The service should be fast.");
    expect(screen.getByText("The system shall allow login.")).toBeDefined();
    expect(screen.getByText("No issues — reads clearly.")).toBeDefined();
  });

  it("calls onReset from the Start over button", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<AnalysisResultView result={result()} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
