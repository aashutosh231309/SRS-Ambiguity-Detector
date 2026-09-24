"use client";

/**
 * Segmented-requirements preview (Stage 06). Shows detected requirements ONLY —
 * identifiers, sections, text, and segmentation evidence. Scores, severities,
 * issues, and AI text are NEVER rendered here (the backend computes none yet,
 * and this component must not invent them — asserted by tests).
 */

import { ArrowLeft, Info } from "lucide-react";

import type { AnalysisResult, SegmentationStrategy } from "@/types/analysis";

import { FormAlert } from "../auth/fields";

const STRATEGY_LABELS: Record<SegmentationStrategy, string> = {
  requirement_id: "ID-tagged",
  decimal: "Decimal",
  numbered: "Numbered",
  bullet: "Bullet",
  paragraph: "Paragraph",
};

export function SegmentPreview({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const count = result.requirements.length;
  return (
    <section aria-labelledby="segment-preview-heading" className="mt-8">
      <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
        {count === 1 ? "1 requirement detected" : `${count} requirements detected`}
      </p>
      <h2 id="segment-preview-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
        {result.title}
      </h2>
      <p className="mt-2 font-mono text-xs text-ink-faint">
        {`Saved · analysis ${result.id.slice(0, 8)} · ${result.requirements_count} segmented`}
      </p>

      <ol className="mt-6 space-y-3">
        {result.requirements.map((requirement) => (
          <li key={requirement.id} className="rounded-card border border-line bg-paper p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="rounded-md border border-line px-2 py-0.5 font-mono text-xs font-medium text-ink-soft">
                R-{requirement.position + 1}
              </span>
              {requirement.identifier ? (
                <span className="font-mono text-xs font-medium text-ink">
                  {requirement.identifier}
                </span>
              ) : null}
              {requirement.section ? (
                <span className="min-w-0 flex-1 basis-40 truncate text-[13px] text-ink-faint">
                  § {requirement.section}
                </span>
              ) : null}
            </div>
            {/* React-escaped by construction — requirement text is untrusted. */}
            <p className="mt-3 text-[15px] leading-[1.65] whitespace-pre-wrap">
              {requirement.text}
            </p>
            <p className="mt-3 font-mono text-xs text-ink-faint">
              {`${STRATEGY_LABELS[requirement.segmentation.strategy]} · ${requirement.segmentation.confidence.toFixed(2)} · L${requirement.segmentation.line_start}–${requirement.segmentation.line_end}`}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <FormAlert kind="info">
          <span className="inline-flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
            <span>
              Confidence reflects how each requirement was detected — not ambiguity. Detection
              scores arrive with the next stage; your segmented requirements are saved and ready.
            </span>
          </span>
        </FormAlert>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-[15px] font-medium text-ink-soft transition hover:bg-paper-deep"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Start over
        </button>
      </div>
    </section>
  );
}
