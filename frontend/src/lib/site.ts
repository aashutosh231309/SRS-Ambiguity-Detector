/** Canonical site metadata. Single source for layout, SEO stubs, and footer copy. */

export const SITE = {
  name: "SRS Ambiguity Detector",
  tagline: "Precision instrument for requirements quality.",
  description:
    "Analyze software requirements with a deterministic ambiguity engine: find vague, " +
    "incomplete, and unmeasurable requirements, understand every finding, and improve " +
    "your SRS with confidence.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
