import type { Metadata, MetadataRoute } from "next";

import { SITE } from "./site";

export const PUBLIC_ROUTES = [
  {
    path: "/",
    changeFrequency: "weekly" as const,
    priority: 1,
  },
] as const;

export const PRIVATE_ROUTES = [
  "/analysis/",
  "/analyzer",
  "/dashboard",
  "/history",
  "/settings",
] as const;

export const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

const DEFAULT_SITE_URL = "http://localhost:3000";
const OG_IMAGE_PATH = "/og/srs-ambiguity-detector.svg";
const LAST_MODIFIED = "2026-09-24";

export function normalizeSiteUrl(
  value: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const candidate = value?.trim() || DEFAULT_SITE_URL;
  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function absoluteUrl(path = "/", base = SITE.url): string {
  return new URL(path, base).toString();
}

export function publicPageMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(OG_IMAGE_PATH);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE.name,
      title,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE.name} product preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
} as const;

export function privatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description,
    robots: PRIVATE_ROBOTS,
  };
}

export function sitemapEntries(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

export function robotsPolicy(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...PRIVATE_ROUTES, ...AUTH_ROUTES, "/*?token=", "/*&token="],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE.url,
  };
}

export function homeStructuredData(): Array<Record<string, unknown>> {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      inLanguage: "en-US",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE.name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: SITE.url,
      description: SITE.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ];
}
