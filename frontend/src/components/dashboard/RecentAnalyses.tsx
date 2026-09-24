"use client";

/**
 * Compact recent-runs list (Stage 11 dashboard section): title links to the
 * saved report, with the same persisted vocabulary as history ("Failed" /
 * "Not scored" / band labels — never invented here). Deliberately NOT the
 * history table — no management actions, just navigation + a way into the
 * full `/history` list.
 */

import Link from "next/link";
import { useId } from "react";

import { ArrowRight } from "lucide-react";

import { BAND_LABELS } from "@/components/analyzer/ScoreRing";
import type { AnalysisSummary } from "@/types/analysis";

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });
}

function sourceLabel(item: AnalysisSummary): string {
  if (item.source_type === "document" && item.document !== null) {
    return `File ${item.document.filename}`;
  }
  if (item.source_type === "document") return "File upload";
  return "Pasted text";
}

function ScoreNote({ item }: { item: AnalysisSummary }) {
  if (item.status === "failed") {
    return <span className="text-sm text-sev-critical">Failed</span>;
  }
  if (item.score === null || item.band === null) {
    return <span className="text-sm text-ink-faint">Not scored</span>;
  }
  return (
    <span className="text-sm text-ink-soft tabular-nums">
      {item.score} · {BAND_LABELS[item.band]}
    </span>
  );
}

export function RecentAnalyses({ items }: { items: AnalysisSummary[] }) {
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase"
      >
        Recent analyses
      </h2>
      <ul className="mt-3 divide-y divide-line">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Link
                href={`/analysis/${item.id}`}
                className="block truncate text-[15px] font-semibold text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-signal/50"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 truncate font-mono text-xs text-ink-faint">
                {sourceLabel(item)} · {formatShortDate(item.created_at)}
              </p>
            </div>
            <div className="shrink-0">
              <ScoreNote item={item} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 rounded-full font-mono text-xs font-medium text-ink-soft transition outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-signal/50"
        >
          View full history
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </p>
    </section>
  );
}
