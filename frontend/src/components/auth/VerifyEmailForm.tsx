"use client";

/**
 * Email verification — auto-submits the `?token=` link on mount (single call,
 * StrictMode-guarded: tokens are single-use). The token is never displayed or
 * logged. Success refreshes identity (cookies are set by the backend) and
 * offers the fixed landing path; failure offers resend recovery.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { AUTH_LANDING_PATH, verifyEmail } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { validateToken } from "@/lib/auth-validation";

import { FormAlert } from "./fields";
import { ResendForm } from "./ResendForm";

type VerifyState =
  | { kind: "invalid-link" }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>(() =>
    validateToken(token) ? { kind: "invalid-link" } : { kind: "verifying" },
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current || token === null || validateToken(token)) return;
    started.current = true;
    const linkToken = token;
    let cancelled = false;
    (async () => {
      try {
        // Token is single-use: exactly one request, then identity refresh.
        await verifyEmail({ token: linkToken });
        await refreshUser();
        if (!cancelled) setState({ kind: "success" });
      } catch (err) {
        if (!cancelled) setState({ kind: "error", message: authErrorMessage(err, "verify") });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  if (state.kind === "verifying") {
    return (
      <div aria-busy="true" aria-label="Verifying your email" className="py-8 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-signal" aria-hidden />
        <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-ink">
          Verifying your email…
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">This takes just a moment.</p>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div className="py-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-sev-low/10">
          <CheckCircle2 className="size-6 text-sev-low" aria-hidden />
        </div>
        <h1 className="mt-5 text-[26px] font-semibold tracking-tight text-ink">Email verified</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Your email is confirmed and you&apos;re logged in. Welcome aboard.
        </p>
        <button
          type="button"
          onClick={() => router.replace(AUTH_LANDING_PATH)}
          className="btn-primary mt-6 w-full justify-center"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h1 className="text-[26px] font-semibold tracking-tight text-ink">
        {state.kind === "invalid-link" ? "Invalid verification link" : "Verification failed"}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        {state.kind === "invalid-link"
          ? "This link is incomplete or malformed. Request a fresh one below."
          : "This verification link is invalid or has expired. Request a fresh one below."}
      </p>
      {state.kind === "error" ? (
        <div className="mt-4">
          <FormAlert kind="error">{state.message}</FormAlert>
        </div>
      ) : null}
      <div className="mt-6 border-t border-line pt-6">
        <ResendForm />
      </div>
      <p className="mt-6 text-center text-[14px] text-ink-soft">
        <Link
          href="/login"
          className="rounded-md font-medium text-signal outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-signal/40"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
