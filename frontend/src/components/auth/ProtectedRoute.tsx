"use client";

/**
 * Private-route foundation (no private pages exist yet in Stage 05 — the first
 * ones will wrap with this). Loading → skeleton (never a private-UI flash);
 * unauthenticated → /login; `requireVerified` gates unverified users behind an
 * inline nudge with resend recovery instead of a dead end.
 */

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

import { ResendForm } from "./ResendForm";

export function ProtectedRoute({
  children,
  requireVerified = false,
}: {
  children: React.ReactNode;
  requireVerified?: boolean;
}) {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading your workspace"
        className="mx-auto w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-xl"
      >
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-40 rounded-lg bg-paper-deep" />
          <div className="h-4 w-full rounded bg-paper-deep" />
          <div className="h-4 w-2/3 rounded bg-paper-deep" />
        </div>
      </div>
    );
  }

  if (requireVerified && !user?.is_verified) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-xl">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gold/15">
          <ShieldCheck className="size-6 text-gold-deep" aria-hidden />
        </div>
        <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-ink">
          Verify your email to continue
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          This area needs a confirmed email. Request a fresh verification link below.
        </p>
        <div className="mt-6">
          <ResendForm defaultEmail={user?.email ?? ""} compact />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
