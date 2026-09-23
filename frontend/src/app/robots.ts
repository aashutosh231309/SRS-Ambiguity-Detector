import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/** Crawler surface stub (docs/SEO_SPEC.md). Private app routes + APIs stay excluded. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
