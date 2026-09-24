import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/** Sitemap stub — public routes only. Stage 26 expands this per docs/SEO_SPEC.md. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE.url, lastModified: new Date(), priority: 1 }];
}
