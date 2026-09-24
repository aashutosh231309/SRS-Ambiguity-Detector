"use client";

/**
 * Post-registration panel — replaces the card after signup. The account exists
 * and IS logged in (session cookies set); this panel explains the verification
 * step with resend recovery. Never claims an email was delivered.
 */

import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";

import { ResendForm } from "./ResendForm";

export function VerifyPending({ email }: { email: string }) {
  const router = useRouter();
  return (
    <div className="mx-auto w-full max-w-md py-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-signal/10">
        <MailCheck className="size-6 text-signal" aria-hidden />
      </div>
      <h1 className="mt-5 text-[26px] font-semibold tracking-tight text-ink">Check your inbox</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        Your account is ready. If <span className="font-medium text-ink">{email}</span> can receive
        mail, a verification link is on its way — it expires in 24 hours.
      </p>
      <div className="mt-6 border-t border-line pt-6">
        <h2 className="text-[14px] font-semibold text-ink">Didn&apos;t get it?</h2>
        <div className="mt-3">
          <ResendForm defaultEmail={email} compact />
        </div>
      </div>
      <button
        type="button"
        onClick={() => router.replace("/login")}
        className="mt-6 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink outline-none transition hover:border-ink-faint hover:bg-paper focus-visible:ring-2 focus-visible:ring-signal/40"
      >
        Back to log in
      </button>
    </div>
  );
}
