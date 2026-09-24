import { describe, expect, it } from "vitest";

import {
  AUTH_ROUTES,
  PRIVATE_ROUTES,
  PUBLIC_ROUTES,
  absoluteUrl,
  homeStructuredData,
  normalizeSiteUrl,
  privatePageMetadata,
  publicPageMetadata,
  robotsPolicy,
  sitemapEntries,
} from "./seo";

const privateAndAuthRoutes = [...PRIVATE_ROUTES, ...AUTH_ROUTES];

describe("SEO site URL helpers", () => {
  it("normalizes canonical origins and strips paths/query strings", () => {
    expect(normalizeSiteUrl("https://example.com/app?utm=x")).toBe("https://example.com");
    expect(normalizeSiteUrl("https://example.com/")).toBe("https://example.com");
  });

  it("falls back to localhost for blank or invalid canonical input", () => {
    expect(normalizeSiteUrl("")).toBe("http://localhost:3000");
    expect(normalizeSiteUrl("not a url")).toBe("http://localhost:3000");
  });

  it("builds absolute URLs without preserving token query parameters", () => {
    expect(absoluteUrl("/reset-password")).toBe("http://localhost:3000/reset-password");
    expect(absoluteUrl("/verify-email")).toBe("http://localhost:3000/verify-email");
  });
});

describe("public metadata", () => {
  it("sets indexable home metadata with canonical, Open Graph, and Twitter cards", () => {
    const metadata = publicPageMetadata({
      title: "SRS Ambiguity Detector",
      description: "Find ambiguous requirements.",
      path: "/",
    });

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/");
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "http://localhost:3000/",
      siteName: "SRS Ambiguity Detector",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(JSON.stringify(metadata)).toContain("/og/srs-ambiguity-detector.svg");
  });
});

describe("private metadata", () => {
  it("sets strict noindex/nofollow and omits canonical and social metadata", () => {
    const metadata = privatePageMetadata("Analysis result", "Private report");

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noarchive: true, nosnippet: true },
    });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });
});

describe("sitemap and robots policies", () => {
  it("includes only intentionally public routes in the sitemap", () => {
    const sitemap = sitemapEntries();
    expect(sitemap.map((entry) => entry.url)).toEqual(["http://localhost:3000/"]);
    expect(PUBLIC_ROUTES.map((route) => route.path)).toEqual(["/"]);

    const serialized = JSON.stringify(sitemap);
    for (const route of privateAndAuthRoutes) {
      expect(serialized).not.toContain(route);
    }
    expect(serialized).not.toContain("/api/");
    expect(serialized).not.toMatch(/token|analysis\/[^\"]+/i);
  });

  it("allows the public root but disallows API, private app, auth, and token-sensitive routes", () => {
    const robots = robotsPolicy();
    const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    if (!rule) throw new Error("robots rule missing");

    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(
      expect.arrayContaining(["/api/", ...privateAndAuthRoutes, "/*?token=", "/*&token="]),
    );
    expect(robots.sitemap).toBe("http://localhost:3000/sitemap.xml");
    expect(robots.host).toBe("http://localhost:3000");
  });
});

describe("structured data", () => {
  it("uses only real generic application data and avoids fake reviews or user content", () => {
    const data = homeStructuredData();
    const serialized = JSON.stringify(data);

    expect(data.map((entry) => entry["@type"])).toEqual(["WebSite", "SoftwareApplication"]);
    expect(serialized).toContain("SRS Ambiguity Detector");
    expect(serialized).not.toMatch(/aggregateRating|review|award|testimonial/i);
    expect(serialized).not.toMatch(/token|session|email|analysisId|documentName|sourceText/i);
  });
});
