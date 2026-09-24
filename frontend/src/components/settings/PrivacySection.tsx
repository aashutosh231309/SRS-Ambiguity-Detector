"use client";

/**
 * Privacy section (Stage 16): an HONEST statement of the data lifecycle — what
 * is stored, what each working control deletes, and what arrives later. There
 * are deliberately no retention/export/purge controls here: a setting with no
 * enforcement behind it would be a fake control (§9 bans those), so Stage 23
 * ships the controls and this section states plainly that they are pending.
 */

import Link from "next/link";

export function PrivacySection() {
  return (
    <section aria-labelledby="privacy-heading" className="mt-10">
      <h2 id="privacy-heading" className="text-2xl font-semibold tracking-[-0.02em]">
        Privacy
      </h2>
      <div className="mt-4 max-w-2xl space-y-3 text-[15px] leading-relaxed text-ink-soft">
        <p>
          Your account holds your analyses and uploaded documents plus, if you added any, your AI
          provider keys — stored encrypted and never shown again after saving. Nothing here is
          shared with other accounts.
        </p>
        <p>
          Deleting an analysis in History removes it permanently, including its uploaded file.
          Deleting your account below removes everything at once: profile, analyses, documents, and
          saved provider keys.
        </p>
        <p>
          Automatic retention controls and a self-serve data export arrive in a later update — until
          then, per-analysis deletion and full account deletion above are the working controls.{" "}
          <Link
            href="/history"
            className="font-semibold text-signal underline underline-offset-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-signal/40"
          >
            Manage analyses in History
          </Link>
        </p>
      </div>
    </section>
  );
}
