"use client";

/**
 * Verification-email resend — shared by the pending panel, verify-email
 * recovery states, and the verified-only route nudge. The backend always
 * answers 202 (anti-enumeration), so success copy never claims delivery.
 */

import { useEffect, useRef, useState } from "react";

import { resendVerification } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { normalizeEmail, validateEmail } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

import { FormAlert, SubmitButton, TextField } from "./fields";

const COOLDOWN_SECONDS = 30;

export function ResendForm({
  defaultEmail = "",
  compact = false,
}: {
  defaultEmail?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    },
    [],
  );

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setCooldown((remaining) => {
        if (remaining <= 1) {
          if (timer.current !== null) window.clearInterval(timer.current);
          timer.current = null;
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || cooldown > 0) return;
    const error = validateEmail(email);
    setEmailError(error ?? undefined);
    setFormError(null);
    setSent(false);
    if (error) return;

    setPending(true);
    try {
      await resendVerification({ email: normalizeEmail(email) });
      setSent(true);
      startCooldown();
    } catch (err) {
      setFormError(authErrorMessage(err, "resend"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Resend verification email">
      <fieldset
        disabled={pending}
        className={cn("m-0 border-0 p-0", compact ? "space-y-3" : "space-y-4")}
      >
        {formError ? <FormAlert kind="error">{formError}</FormAlert> : null}
        {sent ? (
          <FormAlert kind="success">
            If this address can receive mail, a verification link is on its way.
          </FormAlert>
        ) : null}
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={320}
          placeholder="you@example.com"
          value={email}
          onChange={(value) => {
            setEmail(value);
            setEmailError(undefined);
          }}
          error={emailError}
        />
        {cooldown > 0 ? (
          <p aria-live="polite" className="text-[13px] font-medium text-ink-faint tabular-nums">
            You can request another link in {cooldown}s.
          </p>
        ) : null}
        <SubmitButton pending={pending} pendingLabel="Sending…" disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
        </SubmitButton>
      </fieldset>
    </form>
  );
}
