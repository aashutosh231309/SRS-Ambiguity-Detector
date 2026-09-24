import type { Metadata } from "next";

import { AnalysisReportScreen } from "@/components/analyzer/AnalysisReportScreen";

/** Private report route — never indexed (docs/SEO_SPEC.md). */
export const metadata: Metadata = {
  title: "Analysis result",
  robots: { index: false, follow: false },
};

export default function AnalysisDetailPage() {
  return <AnalysisReportScreen />;
}
