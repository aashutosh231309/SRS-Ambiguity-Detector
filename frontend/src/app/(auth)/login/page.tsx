import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to the SRS Ambiguity Detector.",
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}
