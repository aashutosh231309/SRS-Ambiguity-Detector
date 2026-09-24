import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel, AuthPanelFallback } from "@/components/auth/AuthPanel";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthPanel>
      <Suspense fallback={<AuthPanelFallback label="Loading password reset" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPanel>
  );
}
