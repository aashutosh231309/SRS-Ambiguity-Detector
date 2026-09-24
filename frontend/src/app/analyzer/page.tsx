import type { Metadata } from "next";

import { AnalyzerWorkspace } from "@/components/analyzer/AnalyzerWorkspace";

/** Private product surface — never indexed (docs/SEO_SPEC.md). */
export const metadata: Metadata = {
  title: "Analyzer",
  robots: { index: false, follow: false },
};

export default function AnalyzerPage() {
  return <AnalyzerWorkspace />;
}
