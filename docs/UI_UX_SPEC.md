# UI/UX Specification

> **Status:** FOUNDATION as of Stage 01. Design tokens + type + motion constants exist in
> `frontend/src/app/globals.css`. Full design system, marketing pages, and product UI are
> built in their owning stages (05/08/13/15/…). This file is the taste contract: it tells
> every future agent what "premium, not generic" means here.

## 1. Product personality

A **precision instrument for requirements quality** — think engineering workbench, not
chatbot wrapper. Calm, exact, confident. The analyzer feels like lab equipment; the
marketing pages may be more expressive, but never clownish.

Anti-goals (will be rejected in review): generic purple/blue gradients, glassmorphism
everywhere, decorative blobs, neon glows, default-Tailwind card grids, cookie-cutter
dashboard sidebar, emoji iconography, animation for its own sake.

Project contract, verbatim: «The UI must not look like a generic AI-generated SaaS
dashboard.» Public marketing pages may use richer motion; private productivity screens
(analyzer, report, history, dashboard, settings) stay calmer and denser.

## 2. Visual identity foundation (implemented Stage 01, refined later)

**Color (CSS-first tokens in `globals.css`, Tailwind v4 `@theme`):**

| Token | Value | Use |
|-------|-------|-----|
| `--color-paper` | `#FAF8F4` | Light background — warm paper, not sterile white |
| `--color-ink` | `#16140F` | Primary text / dark surfaces |
| `--color-ink-soft` | `#4A463B` | Secondary text |
| `--color-line` | `#E5E0D3` | Hairline borders (1px, restrained) |
| `--color-signal` | `#0E6B4F` | Brand accent — deep requirements-green; CTAs, active states |
| `--color-signal-deep` | `#0A4F3A` | Hover/pressed accent |
| `--color-gold` | `#B98A1C` | Sparingly: highlights, "premium" moments, score bands |
| Severity: `--sev-low/med/high/crit` | `#64748B` / `#B98A1C` / `#C2540A` / `#B4232A` | Severity + score-band semantics (consistent everywhere) |

Dark mode: supported via `prefers-color-scheme`-driven token swap (Stage 05+ refines;
tokens already structured for it). Contrast: body text ≥ 4.5:1 on both themes.

**Typography (locked direction):**
- Sans: `Inter` (UI, prose), self-hosted via Fontsource (ADR-007). Display tightening (`-0.02em`) on H1/H2.
- Mono: `IBM Plex Mono` (requirement IDs, detector IDs, code, fingerprints, scores-as-data).
- Scale: 12 / 13 / 14 / 16 / 20 / 24 / 32 / 44 / 60 — fluid clamp on the top three.
- Requirement text and findings render at 15–16px with 1.65 line-height (readability first).

**Depth & shape:**
- Radius: 10px cards, 8px inputs, full pills for badges. No oversized 24px+ everything-rounding.
- Shadows: one restrained elevation scale (3 steps); borders do more work than shadows.
- Texture: subtle paper grain / hairline rules on marketing surfaces only; product surfaces stay flat.

## 3. Layout system

- Max content width 1200px (marketing), 1440px (product, ultrawide-safe to 2560+).
- Breakpoints (deliberate, not just scaled): 320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920.
- Grids: 4px base spacing scale; section rhythm 64/96/128 (desktop), 40/56/72 (mobile).
- Product shell (Stage 05+): quiet top navbar + contextual sub-navigation per area
  (Analyzer / History / Dashboard / Settings) — NOT a heavy icon sidebar.

## 4. Navbar (binding direction, per master prompt)

Apple-inspired restraint: clean, minimal, glass-like surface with subtle backdrop blur,
hairline bottom border, excellent type, smooth micro-interactions, elegant active indicator
(small underline/pill, spring transition), polished mobile menu (full-sheet, staggered
links, focus-trapped). No mega-menus, no gradient text logos.

## 5. Auth experience (binding concept — IMPLEMENTED Stage 05)

Single `AuthCard` with a **blade/sweep transition** between Login and Sign Up:
one dark covering rectangle translates across the card while both forms go `inert`;
mode swaps mid-cover; focus moves to the new form's first field; a polite live region
announces the change. Desktop: slanted side panel docking left/right (`clip-path`
sweep, no layout animation). Mobile: top strip dropping like a curtain (height sweep,
same phase machine, measured cover height). `prefers-reduced-motion` (via
`useReducedMotionConfig`, honoring `MotionConfig`) swaps instantly with no sweep.
Animation is PRESENTATION only — timeout-driven phases (320ms cover / 60ms hold /
320ms reveal), zero API calls; auth state lives in `AuthProvider`.

Routes (all `noindex, nofollow`, shared `(auth)` shell): `/login`, `/signup`
(same card, `initialMode`), `/forgot-password`, `/reset-password?token=…`,
`/verify-email?token=…`. Post-signup verify-pending panel with resend recovery
(30s cooldown); verify auto-submits once (StrictMode-guarded, single-use tokens);
reset never auto-logs-in. Copy rules: switch on backend `code` (never `message`);
anti-enumeration responses stay non-committal ("If an account exists…"); tokens are
never displayed or logged. `ProtectedRoute` (+ `requireVerified` nudge) and an
unmounted-but-tested `ChangePasswordForm` ship for later stages; post-auth landing
is the temporary fixed `/` until the dashboard stage.

## 6. Motion language (one system, used selectively)

**Tokens:** `ease-out-expo`-ish cubic-bezier `(0.16, 1, 0.3, 1)`; durations 120 / 200 / 320 / 560ms;
spring (stiffness ≈ 380, damping ≈ 30) for press/active states.

| Layer | Where | Pattern |
|-------|-------|---------|
| Micro | buttons, inputs, nav, icons | hover lift 1–2px / press scale 0.98 + spring release; focus ring fade-in |
| Reveal | sections, cards, lists | fade + 12–20px lift; lists stagger 40–60ms; clip/text reveals on marketing only |
| Story | marketing scroll moments | parallax/scrub/pin sparingly (Motion; GSAP only if Motion can't) |
| Premium | hero CTA, spotlight | magnetic CTA (desktop, pointer-fine only), cursor spotlight on 1–2 surfaces |

Rules: analyzer/report UIs stay CALM (micro + reveal only); respect
`prefers-reduced-motion` globally (kill story/premium layers); GPU-friendly
transform/opacity; no continuous heavy blur; lazy/code-split below-fold + charts.

## 7. Data visualization language (analyzer, report, dashboard)

- Ambiguity score = primary metric, rendered as a **gauge/dial** with band color + label
  ("Moderate ambiguity · 72"). Supplementary health dimensions (clarity / specificity /
  measurability / completeness) as slim bars or radar — never competing with the gauge.
- Category distribution: horizontal bars (readable labels beat pie slices).
- Severity distribution: stacked bar with `sev-*` tokens + counts.
- Trends/activity: line/area with restrained grid; empty states explain ("No analyses yet —
  run your first analysis") instead of hollow charts.
- Every chart: title, plain-language caption, accessible table/`aria-label` alternative
  where practical (Stage 28 audits).
- (Stage 09: the analysis report implements this section as-built — `ScoreRing`
  gauge + slim `HealthBars` + horizontal `CategoryBars` + stacked `sev-*`
  severity bar, each with title + caption + text/`aria-label` alternative;
  clean/failed/segmented states explain instead of hollow charts.)

## 8. Explainability UX (binding)

Every issue card exposes: category chip, severity chip, quoted phrase (with in-context
highlight in the requirement text), reason, recommendation, detector id (mono, e.g.
`vague-quantifier`), and a **"Why was this flagged?"** disclosure revealing detection
reasoning (+ optional AI explanation when available). No black boxes.

## 9. Component inventory (evolving — stages check items off)

- [ ] Primitives: Button, Input, Textarea, Select, Badge/Chip, Card, Dialog, Disclosure, Toast, Tooltip, Tabs, Table, EmptyState, Skeleton (Stage 05/08 — Stage 05 shipped auth-scoped fields/alerts only; shared primitives still pending)
- [x] Product: AuthCard+Blade (Stage 05)
- [x] Product: AnalyzerForm + SegmentPreview (Stage 06 — requirements + segmentation evidence only; superseded by the scored result view in Stage 07)
- [x] Product: AnalysisResultView + ScoreRing + RequirementCard + IssueCard + SeverityBadge (Stage 07 — overall score/band + per-requirement scores, severities, `<mark>` highlighting, and "Why was this flagged?" disclosures per §8; Stage 09 report polish: saved `/analysis/[id]` route + CategoryBars/HealthBars overviews, search/filter/sort toolbar, collapsed-by-default issues, copy actions, failed/segmented/clean states)
- [x] Product: AnalyzerWorkspace tabs + DocumentUploadForm dropzone (Stage 08 — feature-local input-method tabs with arrow-key nav; dropzone + picker for exactly one PDF/DOCX/TXT with honest indeterminate progress; shared Tabs/Dropzone primitives still pending)
- [x] Product: HealthBars, CategoryBars, DeleteConfirm dialog (Stage 09 — explicit-confirm delete on the report route; `DELETE`-typing variant still future; Stage 10 — compact row variant + `onDeleted` refetch path for history)
- [x] Product: HistoryScreen + HistoryToolbar + HistoryTable + HistoryPagination (Stage 10 — authenticated `/history` on the list API: debounced server search, band/source filters, backend sort, envelope-driven paging, semantic table → CSS cards, distinct no-analyses/no-match empties)
- [ ] Product: Navbar, TrendChart, SettingsForms, ProviderCard (owning stages)
- [ ] Marketing: Hero, FeatureGrid, HowItWorks steps, CTA, Footer, Breadcrumbs (Stage 26+)

Rules: no fake buttons (every control does something or doesn't ship); no placeholder
lorem; destructive actions confirm; async actions show pending → success/error states.

## 10. Accessibility (binding minimums)

Keyboard-complete flows · visible focus (2px signal ring) · semantic landmarks/headings ·
labeled inputs + `aria-describedby` errors · dialogs focus-trapped + Esc + return-focus ·
`inert` on covered/hidden forms · color never the ONLY signal (severity = color + label) ·
`prefers-reduced-motion` honored · hit targets ≥ 44px on touch. Full audit Stage 28.

## 11. Responsive contract

Every screen is DESIGNED at 390 (phone), 768 (tablet), 1280 (desktop), 1920+ (wide):
navbar collapses ≤768; analyzer stacks input→results vertically on phone; tables become
cards or horizontal-scroll regions with sticky first column; charts reflow (Recharts
`ResponsiveContainer`) with simplified mobile variants; dialogs become bottom sheets ≤430.
Stage 28 verifies the full width matrix (320→2560+).
