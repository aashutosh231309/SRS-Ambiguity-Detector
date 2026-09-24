"use client";

/**
 * Settings dialog chrome — one focus + dismissal contract for the provider
 * dialogs (add/replace/delete). Mirrors the report delete dialog's behavior
 * (UI_UX_SPEC §10): focus moves inside on open, Tab cycles within the panel,
 * Escape cancels, body scroll locks, and focus returns to the opener on
 * close. While `dismissable` is false (a request in flight) Escape and
 * overlay clicks are ignored so a pending mutation can't be orphaned.
 * The panel scrolls internally past 90vh so forms fit small viewports.
 */

import { useEffect, useId, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function DialogShell({
  title,
  description,
  dismissable,
  initialFocus,
  onClose,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  /** False while a mutation is pending (Escape/overlay locked out). */
  dismissable: boolean;
  /** Element to focus on open (safe default when omitted: first control). */
  initialFocus?: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement;
    const panel = panelRef.current;
    const target = initialFocus?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
    target?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [initialFocus]);

  /** Escape cancels; Tab cycles through every focusable control in the panel. */
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (dismissable) onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (panel === null) return;
    const controls = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (first === undefined || last === undefined) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/45"
        onClick={() => {
          if (dismissable) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        onKeyDown={handleKeyDown}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card border border-line bg-paper p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {description === undefined ? null : (
          <div id={descriptionId} className="mt-2 text-sm leading-relaxed text-ink-soft">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
