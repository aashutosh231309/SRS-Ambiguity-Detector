"use client";

/**
 * `/analyzer` workspace (Stage 06): the first private product surface.
 * Verified-users-only (`ProtectedRoute requireVerified` — the API gates the
 * same way). Owns the input→preview state: submitting swaps the editor for
 * the segmented preview; starting over returns to the editor WITH the last
 * submission preserved as a resumable draft.
 */

import { useState } from "react";

import type { AnalysisResult } from "@/types/analysis";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/Reveal";

import { ProtectedRoute } from "../auth/ProtectedRoute";
import { AnalyzerForm, type AnalyzerDraft } from "./AnalyzerForm";
import { SegmentPreview } from "./SegmentPreview";

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
            bulleted, ID-tagged, or plain paragraphs — and save the set for ambiguity detection.
          </p>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-faint">
            This build segments and saves; detection scores arrive with the next stage.
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
          <SegmentPreview result={result} onReset={() => setResult(null)} />
        )}
      </Container>
    </ProtectedRoute>
  );
}
