import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPanel>
      <ForgotPasswordForm />
    </AuthPanel>
  );
}
