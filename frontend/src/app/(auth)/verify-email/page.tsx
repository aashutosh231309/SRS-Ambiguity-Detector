import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel, AuthPanelFallback } from "@/components/auth/AuthPanel";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your email address.",
};

export default function VerifyEmailPage() {
  return (
    <AuthPanel>
      <Suspense fallback={<AuthPanelFallback label="Loading email verification" />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthPanel>
  );
}
