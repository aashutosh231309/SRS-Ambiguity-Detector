import { Suspense } from "react";

import { AuthPanel, AuthPanelFallback } from "@/components/auth/AuthPanel";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Verify email", "Verify your email address.");

export default function VerifyEmailPage() {
  return (
    <AuthPanel>
      <Suspense fallback={<AuthPanelFallback label="Loading email verification" />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthPanel>
  );
}
