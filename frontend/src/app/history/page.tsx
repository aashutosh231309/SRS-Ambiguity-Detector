import type { Metadata } from "next";

import { HistoryScreen } from "@/components/history/HistoryScreen";

/** Private product surface — never indexed (docs/SEO_SPEC.md). */
export const metadata: Metadata = {
  title: "History",
  robots: { index: false, follow: false },
};

export default function HistoryPage() {
  return <HistoryScreen />;
}
