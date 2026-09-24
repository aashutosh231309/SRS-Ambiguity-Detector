"use client";

/**
 * Analysis result (Stage 07): overall score + band, severity counts, and the
 * scored requirement list with nested explainable issues. Scores are rendered
 * as the heuristic indicators they are — the footnote says so on every view.
 */

import { ArrowLeft } from "lucide-react";

import type { AnalysisResult, RequirementSeverity } from "@/types/analysis";

import { RequirementCard } from "./RequirementCard";
import { ScoreRing } from "./ScoreRing";

const SEVERITIES: RequirementSeverity[] = ["low", "medium", "high", "critical"];

export function AnalysisResultView({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const requirements = result.requirements.length;
  const counts = result.score_breakdown?.counts;
  return (
    <section aria-labelledby="analysis-result-heading" className="mt-8">
      <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
        {`Analysis complete · ${requirements} ${requirements === 1 ? "requirement" : "requirements"} · ${result.issues_count} ${result.issues_count === 1 ? "issue" : "issues"}`}
      </p>
      <h2 id="analysis-result-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
        {result.title}
      </h2>
      <p className="mt-2 font-mono text-xs text-ink-faint">
        {`Saved · analysis ${result.id.slice(0, 8)} · ${result.requirements_count} analyzed`}
      </p>

      <div className="mt-6 rounded-card border border-line bg-paper p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <ScoreRing score={result.score} band={result.band} />
          <dl className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
                Requirements
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {result.requirements_count}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
                Issues
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{result.issues_count}</dd>
            </div>
            {SEVERITIES.map((severity) => (
              <div key={severity}>
                <dt className="font-mono text-[11px] tracking-[0.14em] text-ink-faint capitalize">
                  {severity}
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {counts?.[severity] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-faint">
          The score is a transparent heuristic indicator — 100 minus fixed deductions per issue —
          not a scientifically validated measurement of requirement quality.
        </p>
      </div>

      <ol className="mt-6 space-y-3">
        {result.requirements.map((requirement, index) => (
          <RequirementCard key={requirement.id} requirement={requirement} index={index} />
        ))}
      </ol>

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
