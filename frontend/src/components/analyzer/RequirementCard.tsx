"use client";

import type { ReactNode } from "react";

import { motion } from "motion/react";

import type { AnalysisIssue, SegmentedRequirement, SegmentationStrategy } from "@/types/analysis";

import { IssueCard } from "./IssueCard";
import { SeverityBadge } from "./SeverityBadge";

const STRATEGY_LABELS: Record<SegmentationStrategy, string> = {
  requirement_id: "ID-tagged",
  decimal: "Decimal",
  numbered: "Numbered",
  bullet: "Bullet",
  paragraph: "Paragraph",
};

interface Span {
  start: number;
  end: number;
}

/** Merge overlapping/clamping spans so highlights never nest or overrun. */
function unionSpans(textLength: number, issues: AnalysisIssue[]): Span[] {
  const clamped = issues
    .map((issue) => ({
      start: Math.max(0, Math.min(textLength, issue.start_offset)),
      end: Math.max(0, Math.min(textLength, issue.end_offset)),
    }))
    .filter((span) => span.start < span.end)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Span[] = [];
  for (const span of clamped) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ ...span });
    }
  }
  return merged;
}

/** Requirement text with detected phrases marked (React-escaped throughout). */
function MarkedText({ text, issues }: { text: string; issues: AnalysisIssue[] }) {
  if (issues.length === 0) {
    return <>{text}</>;
  }
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const span of unionSpans(text.length, issues)) {
    if (span.start > cursor) {
      nodes.push(text.slice(cursor, span.start));
    }
    nodes.push(
      <mark
        key={`${span.start}-${span.end}`}
        className="rounded-[3px] bg-gold-mist px-0.5 text-inherit"
      >
        {text.slice(span.start, span.end)}
      </mark>,
    );
    cursor = span.end;
  }
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return <>{nodes}</>;
}

/**
 * One scored requirement: score + worst severity + highlighted text +
 * expandable issues + segmentation provenance. Clean requirements say so
 * instead of rendering an empty issues block.
 */
export function RequirementCard({
  requirement,
  index = 0,
}: {
  requirement: SegmentedRequirement;
  /** Position in the list — drives the capped stagger delay. */
  index?: number;
}) {
  const count = requirement.issues.length;
  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.56, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-line bg-paper p-5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="rounded-md border border-line px-2 py-0.5 font-mono text-xs font-medium text-ink-soft">
          R-{requirement.position + 1}
        </span>
        {requirement.identifier ? (
          <span className="font-mono text-xs font-medium text-ink">{requirement.identifier}</span>
        ) : null}
        {requirement.section ? (
          <span className="min-w-0 flex-1 basis-40 truncate text-[13px] text-ink-faint">
            § {requirement.section}
          </span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-3">
          <span className="font-mono text-xs text-ink-faint">
            score{" "}
            <span className="text-sm font-semibold text-ink tabular-nums">
              {requirement.score ?? "—"}
            </span>
          </span>
          {requirement.severity ? <SeverityBadge severity={requirement.severity} /> : null}
        </span>
      </div>

      <p className="mt-3 text-[15px] leading-[1.65] whitespace-pre-wrap">
        <MarkedText text={requirement.text} issues={requirement.issues} />
      </p>

      {count === 0 ? (
        <p className="mt-3 font-mono text-xs text-signal">No issues — reads clearly.</p>
      ) : (
        <div className="mt-3">
          <p className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
            {count === 1 ? "1 issue" : `${count} issues`}
          </p>
          <div className="mt-1">
            {requirement.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 font-mono text-xs text-ink-faint">
        {`${STRATEGY_LABELS[requirement.segmentation.strategy]} · ${requirement.segmentation.confidence.toFixed(2)} · L${requirement.segmentation.line_start}–${requirement.segmentation.line_end}`}
      </p>
    </motion.li>
  );
}
