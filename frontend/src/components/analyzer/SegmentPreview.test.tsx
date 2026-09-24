// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AnalysisResult, SegmentedRequirement } from "@/types/analysis";

import { SegmentPreview } from "./SegmentPreview";

function requirement(overrides: Partial<SegmentedRequirement> = {}): SegmentedRequirement {
  return {
    id: "req-1",
    position: 0,
    identifier: "FR-001",
    section: "Functional Requirements",
    text: "The system shall allow login.",
    score: null,
    severity: null,
    issues_count: 0,
    suggested_rewrite: null,
    suggestion_source: null,
    segmentation: {
      strategy: "requirement_id",
      confidence: 0.95,
      start_offset: 7,
      end_offset: 36,
      line_start: 3,
      line_end: 3,
    },
    issues: [],
    ...overrides,
  };
}

function previewResult(requirements: SegmentedRequirement[]): AnalysisResult {
  return {
    id: "analysis-1",
    title: "Login SRS",
    status: "segmented",
    source_type: "text",
    score: null,
    band: null,
    score_breakdown: {},
    requirements_count: requirements.length,
    issues_count: 0,
    health: null,
    ai_overview: null,
    ai_provider: null,
    ai_status: "skipped",
    ai_error: null,
    requirements,
    created_at: "2026-09-24T00:00:00Z",
    updated_at: "2026-09-24T00:00:00Z",
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("SegmentPreview", () => {
  it("renders every requirement with evidence, and nothing else", () => {
    const result = previewResult([
      requirement(),
      requirement({
        id: "req-2",
        position: 1,
        identifier: null,
        section: null,
        text: "The admin must approve accounts.",
        segmentation: {
          strategy: "numbered",
          confidence: 0.9,
          start_offset: 40,
          end_offset: 72,
          line_start: 5,
          line_end: 5,
        },
      }),
    ]);
    render(<SegmentPreview result={result} onReset={() => {}} />);

    expect(screen.getByText("2 requirements detected")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Login SRS" })).toBeDefined();
    expect(screen.getByText("R-1")).toBeDefined();
    expect(screen.getByText("R-2")).toBeDefined();
    expect(screen.getByText("FR-001")).toBeDefined();
    expect(screen.getByText("§ Functional Requirements")).toBeDefined();
    expect(screen.getByText("The system shall allow login.")).toBeDefined();
    expect(screen.getByText("The admin must approve accounts.")).toBeDefined();
    // Evidence line: humanized strategy + 2-decimal confidence + line refs.
    expect(screen.getByText("ID-tagged · 0.95 · L3–3")).toBeDefined();
    expect(screen.getByText("Numbered · 0.90 · L5–5")).toBeDefined();

    // Scores, severities, issues, and AI text must NEVER appear in the cards.
    for (const item of screen.getAllByRole("listitem")) {
      const card = within(item);
      expect(card.queryByText(/score/i)).toBeNull();
      expect(card.queryByText(/severity/i)).toBeNull();
      expect(card.queryByText(/issue/i)).toBeNull();
      expect(card.queryByText(/AI explanation/i)).toBeNull();
    }
  });

  it("uses the singular heading for one requirement", () => {
    render(<SegmentPreview result={previewResult([requirement()])} onReset={() => {}} />);
    expect(screen.getByText("1 requirement detected")).toBeDefined();
  });

  it("escapes requirement text (untrusted content, never HTML)", () => {
    const xss = '<img src=x onerror="alert(1)"> The system shall sanitize.';
    const { container } = render(
      <SegmentPreview result={previewResult([requirement({ text: xss })])} onReset={() => {}} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(xss)).toBeDefined();
    expect(container.textContent).toContain(xss);
  });

  it("starts over on request", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<SegmentPreview result={previewResult([requirement()])} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
