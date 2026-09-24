// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AnalysisResult } from "@/types/analysis";
import { AuthProvider } from "@/components/auth/AuthProvider";

import { AnalyzerWorkspace } from "./AnalyzerWorkspace";

const nav = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: nav.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function userResponse(verified: boolean) {
  return jsonResponse({
    id: "user-1",
    email: "ada@example.com",
    display_name: "Ada",
    is_verified: verified,
    is_active: true,
    created_at: "2026-09-24T00:00:00Z",
  });
}

function analysisResult(): AnalysisResult {
  return {
    id: "analysis-1",
    title: "Login SRS",
    status: "analyzed",
    source_type: "text",
    score: 100,
    band: "low",
    score_breakdown: {
      base: 100,
      deductions: [],
      counts: { low: 0, medium: 0, high: 0, critical: 0 },
    },
    requirements_count: 1,
    issues_count: 0,
    health: { measurability: 100, specificity: 100, clarity: 100, completeness: 100 },
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
        text: "The system shall allow login.",
        score: 100,
        severity: null,
        issues_count: 0,
        suggested_rewrite: null,
        suggestion_source: null,
        segmentation: {
          strategy: "requirement_id",
          confidence: 0.95,
          start_offset: 7,
          end_offset: 36,
          line_start: 1,
          line_end: 1,
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
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("AnalyzerWorkspace", () => {
  it("runs input → preview → start-over with the draft preserved", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/auth/me")) return userResponse(true);
        if (url.includes("/analysis")) return jsonResponse(analysisResult());
        throw new Error(`unexpected request: ${url}`);
      }),
    );
    render(
      <AuthProvider>
        <AnalyzerWorkspace />
      </AuthProvider>,
    );

    // Verified users get the workspace (title + explanation + editor).
    expect(await screen.findByRole("heading", { name: "Analyze requirements" })).toBeDefined();
    expect(
      screen.getByText(/Paste your SRS text below\. We split it into individual requirements/),
    ).toBeDefined();

    fireEvent.change(screen.getByLabelText("SRS text"), {
      target: { value: "FR-001: The system shall allow login." },
    });
    await user.click(screen.getByRole("button", { name: "Analyze requirements" }));

    // Result replaces the editor (score + the clean requirement).
    expect(await screen.findByText("Analysis complete · 1 requirement · 0 issues")).toBeDefined();
    expect(screen.getByText("The system shall allow login.")).toBeDefined();
    expect(screen.getByText("No issues — reads clearly.")).toBeDefined();
    expect(screen.queryByLabelText("SRS text")).toBeNull();

    // Starting over returns to the editor WITH the submission preserved.
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(((await screen.findByLabelText("SRS text")) as HTMLTextAreaElement).value).toBe(
      "FR-001: The system shall allow login.",
    );
    expect(screen.queryByText("Analysis complete · 1 requirement · 0 issues")).toBeNull();
  });

  it("gates unverified users behind the verify nudge (no editor)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => userResponse(false)),
    );
    render(
      <AuthProvider>
        <AnalyzerWorkspace />
      </AuthProvider>,
    );
    expect(await screen.findByText("Verify your email to continue")).toBeDefined();
    expect(screen.queryByLabelText("SRS text")).toBeNull();
  });

  it("redirects signed-out visitors to /login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { code: "unauthenticated", message: "no" } }, 401)),
    );
    render(
      <AuthProvider>
        <AnalyzerWorkspace />
      </AuthProvider>,
    );
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByLabelText("SRS text")).toBeNull();
  });
});
