// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { AnalysisIssue, SegmentedRequirement } from "@/types/analysis";

import { RequirementCard } from "./RequirementCard";

function issue(overrides: Partial<AnalysisIssue> = {}): AnalysisIssue {
  return {
    id: "issue-1",
    detector_id: "subjective-term",
    category: "Subjective term",
    severity: "high",
    phrase: "fast",
    start_offset: 0,
    end_offset: 4,
    reason: "“fast” means different response times to different reviewers.",
    recommendation: "State the response time in milliseconds.",
    ai_explanation: null,
    ...overrides,
  };
}

function requirement(overrides: Partial<SegmentedRequirement> = {}): SegmentedRequirement {
  return {
    id: "req-1",
    position: 0,
    identifier: "FR-001",
    section: "Performance",
    text: "The service should be fast.",
    score: 70,
    severity: "high",
    issues_count: 2,
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
    issues: [],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("RequirementCard", () => {
  it("renders header (position, id, section, score, severity) + provenance", () => {
    render(
      <RequirementCard
        requirement={requirement({
          issues: [issue({ id: "a", phrase: "fast", start_offset: 22, end_offset: 26 })],
        })}
      />,
    );
    expect(screen.getByText("R-1")).toBeDefined();
    expect(screen.getByText("FR-001")).toBeDefined();
    expect(screen.getByText("§ Performance")).toBeDefined();
    expect(screen.getByText("70")).toBeDefined();
    // Requirement badge + the nested issue's badge.
    expect(screen.getAllByText("High")).toHaveLength(2);
    expect(screen.getByText("ID-tagged · 0.95 · L1–1")).toBeDefined();
  });

  it("says clean requirements read clearly instead of an empty issues block", () => {
    render(<RequirementCard requirement={requirement({ score: 100, severity: null })} />);
    expect(screen.getByText("No issues — reads clearly.")).toBeDefined();
    expect(screen.getByText("The service should be fast.")).toBeDefined();
    // Clean requirements carry no severity — no badge renders.
    expect(screen.queryByText("Low")).toBeNull();
    expect(screen.queryByText("Medium")).toBeNull();
    expect(screen.queryByText("High")).toBeNull();
    expect(screen.queryByText("Critical")).toBeNull();
  });

  it("marks each detected phrase separately (2 issues → 2 marks)", () => {
    const { container } = render(
      <RequirementCard
        requirement={requirement({
          issues: [
            issue({ id: "a", phrase: "should", start_offset: 12, end_offset: 18 }),
            issue({ id: "b", phrase: "fast", start_offset: 22, end_offset: 26 }),
          ],
        })}
      />,
    );
    expect(screen.getByText("2 issues")).toBeDefined();
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
    expect(marks.item(0)?.textContent).toBe("should");
    expect(marks.item(1)?.textContent).toBe("fast");
  });

  it("merges overlapping spans into a single mark (never nested)", () => {
    const { container } = render(
      <RequirementCard
        requirement={requirement({
          issues: [
            issue({ id: "a", phrase: "should be", start_offset: 12, end_offset: 21 }),
            issue({ id: "b", phrase: "be fast", start_offset: 19, end_offset: 26 }),
          ],
        })}
      />,
    );
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks.item(0)?.textContent).toBe("should be fast");
  });

  it("clamps out-of-range offsets instead of crashing or overrunning", () => {
    const { container } = render(
      <RequirementCard
        requirement={requirement({
          issues: [
            issue({ id: "a", phrase: "???", start_offset: 90, end_offset: 120 }),
            issue({ id: "b", phrase: "The", start_offset: -5, end_offset: 3 }),
          ],
        })}
      />,
    );
    // The far-off span collapses to nothing; the negative start clamps to 0.
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks.item(0)?.textContent).toBe("The");
    expect(container.textContent).toContain("The service should be fast.");
  });
});
