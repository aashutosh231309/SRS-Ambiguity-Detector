import type { Metadata } from "next";

import { SettingsScreen } from "@/components/settings/SettingsScreen";

/** Private product surface — never indexed (docs/SEO_SPEC.md). */
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
