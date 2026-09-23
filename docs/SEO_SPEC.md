# SEO Specification

> **Status:** FOUNDATION as of Stage 01 (`layout` metadata, `robots.ts`, `sitemap.ts` stubs).
> Full program in Stage 26 (foundation) + Stage 27 (content/structured data). Private app
> routes are NEVER SEO'd (noindex + auth gate).

## 1. Goals (honest)

Strong TECHNICAL SEO for public pages: crawlable, fast, semantic, correctly described.
We do NOT claim or target "#1 on Google" — no rank guarantees anywhere in copy or docs.

## 2. Public information architecture (planned)

| Route | Intent | Priority |
|-------|--------|----------|
| `/` | Product overview + primary CTA | 1.0 |
| `/features` | Capability tour (engine, scoring, reports, dashboard, AI option) | 0.9 |
| `/how-it-works` | Pipeline: input → deterministic engine → score → improvements | 0.9 |
| `/srs-ambiguity-detector` | Evergreen explainer: what SRS ambiguity is + categories | 0.8 |
| `/resources/*` (later) | Guides: writing unambiguous requirements, SRS checklists | 0.6 |
| `/privacy`, `/terms` | Policy pages (thin, noindex optional — Stage 23 decides) | 0.3 |

Private (`/app/*` group or equivalent — noindex, nofollow, excluded from sitemap):
analyzer, analysis detail, history, dashboard, settings. Auth pages: noindex.

## 3. Technical requirements (Stage 26 implements; contract now)

- Next.js App Router metadata API per route: unique `<title>` (≤60 chars),
  meta description (≤160), canonical (absolute, via `NEXT_PUBLIC_SITE_URL`),
  Open Graph + Twitter cards (1200×630 OG image in `public/og/`).
- `robots.ts`: allow public, disallow `/app/*`, `/api/*` (frontend API alias if any);
  sitemap reference. `sitemap.ts`: public routes only, with `lastModified`.
- Semantic HTML: one `h1` per page, logical heading order, landmarks, descriptive links,
  alt text on all informative images, `next/image` with sizes.
- JSON-LD: `SoftwareApplication` (+ `aggregateRating` ONLY if real reviews exist —
  never fake), `BreadcrumbList`, `FAQPage` where genuine FAQs exist, `HowTo` for
  how-it-works steps. Staged in `src/lib/seo.ts` + per-page `<script type="application/ld+json">`.
- Performance = SEO: LCP < 2.5 s on mid-tier mobile, CLS < 0.1, no layout-shifting fonts
  (`next/font` with `display: swap` + size-adjust), images optimized, JS code-split.
- Correct 404 (`not-found.tsx`, noindex) + clean 404 copy with search/nav recovery.
- Internal linking: features ↔ how-it-works ↔ detector explainer ↔ resources; breadcrumbs
  on nested pages.

## 4. Content principles (Stage 27)

- Every public page answers ONE search intent with genuine depth (600–1500 words where
  appropriate, real examples from the engine's categories — e.g. before/after requirements).
- No keyword stuffing, no doorway pages, no AI-spun thin content, no fake testimonials,
  no fabricated metrics ("trusted by 10,000 teams" is FORBIDDEN unless true).
- Deterministic-engine transparency doubles as E-E-A-T: show the method, the categories,
  the scoring heuristic, and limitations honestly.

## 5. Measurement (Stage 24/27)

Search Console + sitemap submission, Core Web Vitals monitoring, OG card validation,
structured-data validation (Rich Results Test), broken-link checks in `verify.sh`.
All analytics privacy-respecting (no requirement text in events — see SECURITY_SPEC).
