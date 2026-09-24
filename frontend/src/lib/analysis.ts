/**
 * Analysis API layer — the ONLY module that talks to `/analysis/*`. Built
 * exclusively on the canonical client (`lib/api.ts`): cookies flow via
 * `credentials: "include"` and session tokens never touch JS.
 *
 * Creation silent-refreshes a stale session exactly like `changePassword`: a
 * 401 means "not executed" (the guard rejects before the service runs), so the
 * single retry cannot double-create.
 */

import type { AnalysisResult, CreateAnalysisInput } from "../types/analysis";

import { api } from "./api";
import { withSessionRetry } from "./auth";

/** Server limits mirrored for instant client feedback (server authoritative). */
export const ANALYZER_LIMITS = { maxChars: 200_000, maxTitle: 200 } as const;

/** Segment pasted SRS text into persisted requirements (Stage 06). */
export async function createAnalysis(input: CreateAnalysisInput): Promise<AnalysisResult> {
  return withSessionRetry(() =>
    api<AnalysisResult>("/analysis", {
      method: "POST",
      body: { title: input.title, text: input.text },
    }),
  );
}
