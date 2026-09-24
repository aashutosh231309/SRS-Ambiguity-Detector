import { describe, expect, it } from "vitest";

import { metadata as verifyEmailMetadata } from "./(auth)/verify-email/page";
import { metadata as resetPasswordMetadata } from "./(auth)/reset-password/page";
import { metadata as loginMetadata } from "./(auth)/login/page";
import { metadata as signupMetadata } from "./(auth)/signup/page";
import { metadata as forgotPasswordMetadata } from "./(auth)/forgot-password/page";
import { metadata as analysisMetadata } from "./analysis/[id]/page";
import { metadata as analyzerMetadata } from "./analyzer/page";
import { metadata as dashboardMetadata } from "./dashboard/page";
import { metadata as historyMetadata } from "./history/page";
import { metadata as notFoundMetadata } from "./not-found";
import { metadata as homeMetadata } from "./page";
import robots from "./robots";
import { metadata as settingsMetadata } from "./settings/page";
import sitemap from "./sitemap";

const privateRouteMetadata = [
  analysisMetadata,
  analyzerMetadata,
  dashboardMetadata,
  historyMetadata,
  settingsMetadata,
  notFoundMetadata,
];

const authRouteMetadata = [
  loginMetadata,
  signupMetadata,
  forgotPasswordMetadata,
  resetPasswordMetadata,
  verifyEmailMetadata,
];

function expectNoindex(metadata: typeof analysisMetadata) {
  expect(metadata.robots).toMatchObject({
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  });
  expect(metadata.alternates).toBeUndefined();
  expect(metadata.openGraph).toBeUndefined();
  expect(metadata.twitter).toBeUndefined();
}

describe("route SEO contracts", () => {
  it("publishes indexable home metadata only for the public landing page", () => {
    expect(homeMetadata.robots).toEqual({ index: true, follow: true });
    expect(homeMetadata.alternates?.canonical).toBe("http://localhost:3000/");
    expect(homeMetadata.openGraph).toMatchObject({
      type: "website",
      url: "http://localhost:3000/",
      siteName: "SRS Ambiguity Detector",
    });
    expect(homeMetadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("keeps app, report, and 404 routes non-indexable with no public social metadata", () => {
    for (const metadata of privateRouteMetadata) {
      expectNoindex(metadata);
    }
  });

  it("keeps auth and token-capable routes non-indexable and free of canonical query leakage", () => {
    for (const metadata of authRouteMetadata) {
      expectNoindex(metadata);
      expect(JSON.stringify(metadata)).not.toMatch(/token|session|email=/i);
    }
  });

  it("generates a public-only sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(["http://localhost:3000/"]);
    expect(JSON.stringify(urls)).not.toMatch(
      /\/analysis\/|\/analyzer|\/dashboard|\/history|\/settings|\/login|\/signup|reset-password|verify-email|token|\/api\//i,
    );
  });

  it("disallows private, auth, API, and token-sensitive paths in robots.txt", () => {
    const policy = robots();
    const rule = Array.isArray(policy.rules) ? policy.rules[0] : policy.rules;
    if (!rule) throw new Error("robots rule missing");

    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(
      expect.arrayContaining([
        "/api/",
        "/analysis/",
        "/analyzer",
        "/dashboard",
        "/history",
        "/settings",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/*?token=",
        "/*&token=",
      ]),
    );
  });
});
