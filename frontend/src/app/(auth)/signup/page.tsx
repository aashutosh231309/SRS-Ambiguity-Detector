import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your SRS Ambiguity Detector account.",
};

export default function SignupPage() {
  return <AuthCard initialMode="signup" />;
}
