# SEO Specification

> **Status:** Stage 26 technical foundation implemented. Public marketing content expansion,
> Search Console/Core Web Vitals/OG-card validation, Rich Results validation, and deeper
> resource pages remain Stage 27+ work. Private authenticated app routes are NEVER SEO'd:
> they are `noindex,nofollow`, excluded from the sitemap/structured data, and still require
> authenticated ownership checks.

## 1. Goals (honest)

Strong TECHNICAL SEO for public pages: crawlable, fast, semantic, correctly described.
We do NOT claim or target "#1 on Google" — no rank guarantees anywhere in copy or docs.

## 2. Public information architecture

### Implemented in Stage 26

| Route | Intent                         | Indexing policy                                         | Sitemap  |
| ----- | ------------------------------ | ------------------------------------------------------- | -------- |
| `/`   | Product overview + primary CTA | `index,follow` with canonical, OG, Twitter, and JSON-LD | Included |

### Planned for Stage 27+ content expansion

| Route                     | Intent                                                                 | Priority |
| ------------------------- | ---------------------------------------------------------------------- | -------- |
| `/features`               | Capability tour (engine, scoring, reports, dashboard, AI option)       | 0.9      |
| `/how-it-works`           | Pipeline: input → deterministic engine → score → improvements          | 0.9      |
| `/srs-ambiguity-detector` | Evergreen explainer: what SRS ambiguity is + categories                | 0.8      |
| `/resources/*` (later)    | Guides: writing unambiguous requirements, SRS checklists               | 0.6      |
| `/privacy`, `/terms`      | Policy pages (thin, noindex optional until content/legal scope exists) | 0.3      |

Private/authenticated app routes are not public IA: `/analyzer`, `/analysis/[id]`,
`/history`, `/dashboard`, and `/settings` are `noindex,nofollow`, omitted from sitemap,
and excluded from public structured data/social metadata. Auth utility routes (`/login`,
`/signup`, `/forgot-password`, `/reset-password`, `/verify-email`) are also noindex and
never receive canonicals containing token/session/email query parameters.

## 3. Technical requirements and Stage 26 posture

- Next.js App Router metadata is centralized in `frontend/src/lib/seo.ts` and
  `frontend/src/lib/site.ts`.
- Canonicals, sitemap host, and robots sitemap URL come from `NEXT_PUBLIC_SITE_URL`,
  normalized to an origin with safe `http://localhost:3000` fallback. Query strings are
  not used in canonical generation.
- Public `/` metadata has a stable title, ≤160-character description, canonical URL,
  Open Graph, and Twitter large-card metadata using the project-owned 1200×630 asset at
  `frontend/public/og/srs-ambiguity-detector.svg`.
- Root layout sets only safe global app metadata/icons. Public OG/canonical metadata lives
  on public pages so authenticated/private pages do not inherit public discoverability.
- `robots.ts` allows `/` and disallows `/api/`, private app routes, auth routes, and
  token-sensitive query patterns. Robots is defense-in-depth only; private pages still
  export route metadata with noindex/nofollow.
- `sitemap.ts` is generated from a maintainable public-route registry and currently emits
  only `/`. It must never include API, auth, token, private app, or analysis-detail URLs.
- JSON-LD on `/` includes only generic `WebSite` and `SoftwareApplication` data. No fake
  reviews, ratings, testimonials, awards, organization/location claims, or user-specific
  analysis/document data are allowed.
- 404/not-found output uses safe copy and noindex metadata; loading/error screens avoid
  diagnostics, identifiers, traces, internal API details, and user content.
- Performance posture: no third-party SEO scripts, no runtime API calls for metadata, no
  user-content metadata generation, and no new external font/image dependencies.
- Semantic HTML/accessibility: `/` has a single `h1`, landmarks, descriptive links, logical
  headings, and no hidden SEO text or keyword stuffing. Later responsive/a11y refinement
  remains Stage 28.

## 4. Content principles (Stage 27)

- Every new public page answers ONE search intent with genuine depth (600–1500 words where
  appropriate, real examples from the engine's categories — e.g. before/after requirements).
- No keyword stuffing, no doorway pages, no AI-spun thin content, no fake testimonials,
  no fabricated metrics ("trusted by 10,000 teams" is FORBIDDEN unless true).
- Deterministic-engine transparency doubles as E-E-A-T: show the method, the categories,
  the scoring heuristic, and limitations honestly.
- New public pages must be added to the centralized public-route registry and covered by
  sitemap/metadata tests before release.

## 5. Measurement (Stage 27+)

Stage 24 established privacy-first application error monitoring (Sentry scrubbers,
request IDs, safe logs) only. Stage 26 added repository-level technical SEO tests and a
production-build artifact check, but did not submit to search engines or run external
browser/search-console validation. Search Console + sitemap submission, Core Web Vitals
monitoring, OG card validation, structured-data validation (Rich Results Test), and
broken-link checks remain Stage 27/SEO work unless a later stage explicitly pulls them
forward. All analytics must be privacy-respecting: no requirement text, uploaded document
content, AI prompts/responses, credentials, tokens, emails, or analysis/report IDs in events
(see SECURITY_SPEC §11).
