"use client";

/** Cloudflare Turnstile widget wrapper (Stage 22).
 *
 * Site key is public (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`). The secret never
 * enters the browser. If no site key is configured, the component renders
 * nothing so local development remains unchanged while the backend is disabled.
 */

import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_ID = "cf-turnstile-script";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove?: (widgetId: string) => void;
  reset?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoading !== null) return scriptLoading;
  scriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile_load_failed")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile_load_failed"));
    document.head.appendChild(script);
  });
  return scriptLoading;
}

export function isTurnstileConfigured(): boolean {
  return SITE_KEY.length > 0;
}

export function TurnstileWidget({
  onToken,
  onExpired,
  onError,
  resetSignal,
}: {
  onToken: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
  /** Increment to reset after backend rejection. */
  resetSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    isTurnstileConfigured() ? "loading" : "ready",
  );

  useEffect(() => {
    if (!isTurnstileConfigured() || containerRef.current === null) return;
    let cancelled = false;
    void loadTurnstileScript()
      .then(() => {
        if (cancelled || containerRef.current === null || !window.turnstile) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => {
            setStatus("ready");
            onToken(token);
          },
          "expired-callback": () => {
            onExpired();
            setStatus("ready");
          },
          "error-callback": () => {
            onError();
            setStatus("error");
          },
        });
        setStatus("ready");
      })
      .catch(() => {
        onError();
        setStatus("error");
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, [onError, onExpired, onToken]);

  useEffect(() => {
    if (!widgetId.current || !window.turnstile?.reset) return;
    window.turnstile.reset(widgetId.current);
  }, [resetSignal]);

  if (!isTurnstileConfigured()) return null;
  return (
    <div className="space-y-2">
      <div ref={containerRef} aria-label="Security verification" />
      <p aria-live="polite" className="font-mono text-xs text-ink-faint">
        {status === "loading"
          ? "Loading security verification…"
          : status === "error"
            ? "Security verification could not load. Try refreshing."
            : "Security verification ready."}
      </p>
    </div>
  );
}
