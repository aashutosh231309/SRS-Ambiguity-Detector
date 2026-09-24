# SEO Specification

> **Status:** Stage 27 public content/discoverability layer implemented. Public content is
> static, truthful, internally linked, and generated through the Stage 26 SEO infrastructure.
> Search Console/Core Web Vitals field data, external OG-card crawler validation, Rich Results
> validation, and deployment-domain verification remain future/deployment work. Private
> authenticated app routes are NEVER SEO'd: they are `noindex,nofollow`, excluded from sitemap
> and structured public data, and still require authenticated ownership checks.

## 1. Goals (honest)

Strong TECHNICAL SEO for public pages: crawlable, fast, semantic, correctly described.
We do NOT claim or target "#1 on Google" — no rank guarantees anywhere in copy or docs.
SEO follows useful content; it never replaces it with doorway pages, keyword stuffing, fake
claims, or hidden text.

## 2. Public information architecture

### Implemented public/indexable routes

| Route                                   | Intent                                                                         | Sitemap priority |
| --------------------------------------- | ------------------------------------------------------------------------------ | ---------------- |
| `/`                                     | Product overview + primary CTA                                                 | 1.0              |
| `/features`                             | Capability tour: text/document analysis, segmentation, scoring, reports, AI    | 0.9              |
| `/how-it-works`                         | Workflow: input/upload → segmentation → deterministic detectors → score/report | 0.9              |
| `/resources`                            | Resource hub for educational SRS ambiguity content                             | 0.7              |
| `/resources/what-is-srs-ambiguity`      | Evergreen explainer for SRS ambiguity and currently detected categories        | 0.6              |
| `/resources/write-clearer-requirements` | Practical guide for measurable, specific, clear, complete requirements         | 0.6              |

The earlier planned standalone `/srs-ambiguity-detector` intent is currently satisfied by the
resource article `/resources/what-is-srs-ambiguity` to avoid duplicative thin pages. Future
public pages must have a distinct user/search intent before being added.

### Private/authenticated and noindex routes

Private/authenticated app routes are not public IA: `/analyzer`, `/analysis/[id]`,
`/history`, `/dashboard`, and `/settings` are `noindex,nofollow`, omitted from sitemap,
and excluded from public structured data/social metadata. Auth utility routes (`/login`,
`/signup`, `/forgot-password`, `/reset-password`, `/verify-email`) are also noindex and
never receive canonicals containing token/session/email query parameters.

## 3. Technical posture

- Next.js App Router metadata is centralized in `frontend/src/lib/seo.ts` and
  `frontend/src/lib/site.ts`; public content route facts live in
  `frontend/src/lib/public-content.ts`.
- Canonicals, sitemap host, and robots sitemap URL come from `NEXT_PUBLIC_SITE_URL`,
  normalized to an origin with safe `http://localhost:3000` fallback. Query strings are
  not used in canonical generation.
- Public pages have stable, unique titles and ≤160-character descriptions, canonical URLs,
  Open Graph, and Twitter large-card metadata using the project-owned 1200×630 asset at
  `frontend/public/og/srs-ambiguity-detector.svg`.
- Root layout sets only safe global app metadata/icons. Public OG/canonical metadata lives
  on public pages so authenticated/private pages do not inherit public discoverability.
- `robots.ts` explicitly allows public routes and disallows `/api/`, private app routes,
  auth routes, and token-sensitive query patterns. Robots is defense-in-depth only;
  private pages still export route metadata with noindex/nofollow.
- `sitemap.ts` is generated from the public-route registry. It must never include API,
  auth, token, private app, or analysis-detail URLs.
- Public structured data is limited to accurate `WebSite`, `SoftwareApplication`,
  `BreadcrumbList`, and `Article` entries that match visible page content. No fake reviews,
  ratings, testimonials, awards, prices, organization/location claims, or user-specific
  analysis/document data are allowed.
- Public content is static/server-rendered. It introduces no third-party SEO scripts, no
  runtime API calls for metadata, no user-content metadata generation, and no new external
  font/image dependencies.
- Semantic HTML/accessibility: public pages use one meaningful `h1`, logical headings,
  landmarks, descriptive links, and no hidden SEO text or keyword stuffing. Full responsive
  and accessibility refinement remains Stage 28.

## 4. Content principles

- Every public page answers one real user/search intent with useful depth and synthetic
  examples grounded in the implemented product.
- Public claims must be grounded in code/spec reality: PDF/DOCX/TXT upload support, 200k
  text/extraction budgets, deterministic category findings, severity, scoring, health
  dimensions, optional user-configured AI enhancement, private history/dashboard/reporting,
  and short-lived authenticated document download workflows.
- Do not advertise unsupported capabilities: OCR, universal ambiguity detection, perfect
  accuracy, compliance certifications, enterprise guarantees, fabricated customer counts,
  real-time AI behavior, unsupported file formats, or fake awards.
- Deterministic-engine transparency doubles as E-E-A-T: show the method, categories,
  scoring heuristic, and limitations honestly.
- New public pages must be added to the centralized public-route registry and covered by
  sitemap/metadata/content tests before release.

## 5. Measurement and validation

Stage 24 established privacy-first application error monitoring only. Stage 26 added
repository-level technical SEO tests. Stage 27 added public content tests, sitemap/robots
coverage, metadata coverage, and production-build artifact checks. Search Console sitemap
submission, Core Web Vitals monitoring, external OG-card validation, Rich Results Test,
broken-link crawling beyond repository-level route tests, and deployment-domain validation
remain Stage 30/deployment or later SEO operations work unless a later stage explicitly pulls
them forward. All analytics must be privacy-respecting: no requirement text, uploaded document
content, AI prompts/responses, credentials, tokens, emails, or analysis/report IDs in events
(see SECURITY_SPEC §11).
