import type { Metadata } from "next";

import { DashboardScreen } from "@/components/dashboard/DashboardScreen";

/** Private product surface — never indexed (docs/SEO_SPEC.md). */
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
