"use client";

/**
 * `/analyzer` workspace (Stage 07): the first private product surface.
 * Verified-users-only (`ProtectedRoute requireVerified` — the API gates the
 * same way). Owns the input→result state: submitting swaps the editor for
 * the scored analysis result; starting over returns to the editor WITH the
 * last submission preserved as a resumable draft.
 */

import { useState } from "react";

import type { AnalysisResult } from "@/types/analysis";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/Reveal";

import { ProtectedRoute } from "../auth/ProtectedRoute";
import { AnalysisResultView } from "./AnalysisResultView";
import { AnalyzerForm, type AnalyzerDraft } from "./AnalyzerForm";

export function AnalyzerWorkspace() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [draft, setDraft] = useState<AnalyzerDraft | undefined>(undefined);

  return (
    <ProtectedRoute requireVerified>
      <Container className="max-w-3xl py-10 sm:py-14">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">Analyzer</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-balance sm:text-4xl">
            Analyze requirements
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Paste your SRS text below. We split it into individual requirements — numbered,
            bulleted, ID-tagged, or plain paragraphs — then run the deterministic ambiguity
            detectors over each one and score the set.
          </p>
        </Reveal>

        {result === null ? (
          <AnalyzerForm
            initial={draft}
            onResult={(analysis, submitted) => {
              setResult(analysis);
              setDraft(submitted);
            }}
          />
        ) : (
          <AnalysisResultView result={result} onReset={() => setResult(null)} />
        )}
      </Container>
    </ProtectedRoute>
  );
}
