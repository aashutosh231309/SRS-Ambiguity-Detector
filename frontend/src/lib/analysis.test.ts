import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnalysisResult, SegmentedRequirement } from "../types/analysis";
import { ApiRequestError } from "./api";
import { ANALYZER_LIMITS, createAnalysis } from "./analysis";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function envelope(code: string, status: number): Response {
  return jsonResponse({ error: { code, message: `server ${code}` } }, status);
}

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
      start_offset: 0,
      end_offset: 29,
      line_start: 1,
      line_end: 1,
    },
    issues: [],
    ...overrides,
  };
}

function analysisResult(): AnalysisResult {
  return {
    id: "analysis-1",
    title: "Login SRS",
    status: "segmented",
    source_type: "text",
    score: null,
    band: null,
    score_breakdown: {},
    requirements_count: 1,
    issues_count: 0,
    health: null,
    ai_overview: null,
    ai_provider: null,
    ai_status: "skipped",
    ai_error: null,
    requirements: [requirement()],
    created_at: "2026-09-24T00:00:00Z",
    updated_at: "2026-09-24T00:00:00Z",
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("analysis api layer", () => {
  it("posts title+text to /analysis and returns the parsed result", async () => {
    const inits: Array<RequestInit | undefined> = [];
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        urls.push(String(input));
        inits.push(init);
        return jsonResponse(analysisResult());
      }),
    );
    const result = await createAnalysis({ title: "Login SRS", text: "FR-001: hi" });
    expect(result).toEqual(analysisResult());
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/\/analysis$/);
    expect(inits[0]?.method).toBe("POST");
    expect(JSON.parse(String(inits[0]?.body))).toEqual({
      title: "Login SRS",
      text: "FR-001: hi",
    });
  });

  it("sends a blank title as-is (the server applies the fallback)", async () => {
    const inits: Array<RequestInit | undefined> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        inits.push(init);
        return jsonResponse(analysisResult());
      }),
    );
    await createAnalysis({ title: "", text: "FR-001: hi" });
    expect(JSON.parse(String(inits[0]?.body))).toEqual({ title: "", text: "FR-001: hi" });
  });

  it("silently refreshes once on 401, then retries the creation", async () => {
    const paths: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        paths.push(url);
        if (url.includes("/auth/refresh")) {
          return jsonResponse({ id: "u1", email: "ada@example.com", is_verified: true });
        }
        if (paths.filter((p) => p.endsWith("/analysis")).length === 1) {
          return envelope("unauthenticated", 401);
        }
        return jsonResponse(analysisResult());
      }),
    );
    const result = await createAnalysis({ title: "t", text: "FR-001: hi" });
    expect(result.id).toBe("analysis-1");
    expect(paths.filter((p) => p.endsWith("/analysis"))).toHaveLength(2);
    expect(paths.filter((p) => p.includes("/auth/refresh"))).toHaveLength(1);
  });

  it("rethows the ORIGINAL 401 when refresh fails (no loop, no masking)", async () => {
    const paths: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        paths.push(url);
        return url.includes("/auth/refresh")
          ? envelope("invalid_token", 400)
          : envelope("unauthenticated", 401);
      }),
    );
    const failure = await createAnalysis({ title: "t", text: "FR-001: hi" }).catch(
      (err: unknown) => err,
    );
    expect(failure).toBeInstanceOf(ApiRequestError);
    expect((failure as ApiRequestError).code).toBe("unauthenticated");
    expect(paths.filter((p) => p.endsWith("/analysis"))).toHaveLength(1);
  });

  it("does not retry non-401 failures", async () => {
    const fetchMock = vi.fn(async () => envelope("no_requirements_detected", 400));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createAnalysis({ title: "t", text: "prose" })).rejects.toMatchObject({
      code: "no_requirements_detected",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mirrors the server limits", () => {
    expect(ANALYZER_LIMITS).toEqual({ maxChars: 200_000, maxTitle: 200 });
  });
});
