# Screenshots

Assignment deliverable: UI captures of the finished product (plus per-stage progress shots).

## Convention

- Naming: `stageNN-short-description--<viewport>W<viewport>H.png`
  (e.g. `stage05-auth-card--1440x900.png`, `stage13-report-mobile--390x844.png`).
- Capture at representative widths: `390` (phone) · `768` (tablet) · `1440` (desktop).
- Prefer real data over lorem; redact any personal emails/keys before committing.
- Keep the folder lean: final set ≤ ~25 images (replace stale captures when UI changes).

## Current set

_(Empty — Stages 05 (auth UI) and 06 (analyzer input + preview) shipped WITHOUT
captures: the build sandbox has no browser (no Chromium/Firefox; Playwright CDN +
Debian mirrors blocked), so no pixel QA was possible. The first browsed
environment must capture the auth set (`stage05-*`) AND the analyzer set
(`stage06-*`: empty editor, filled editor with counts, validation errors,
segmented preview at 390/768/1440) + re-verify the blade sweep by eye — see
`docs/STAGE_STATUS.md` Stages 05–06 "Known limitations".)_
