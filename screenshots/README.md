# Screenshots

Screenshots are part of the final submission package. They must be captured from the **actual running application**, not mockups.

## Stage 31 status

No screenshots are committed yet. Stage 31 rechecked the sandbox and found no browser automation/runtime available (`chromium`, `chromium-browser`, `google-chrome`, and `playwright` were unavailable). Therefore this repository does **not** claim browser or screenshot validation from the sandbox.

A project owner/reviewer with a browser should run the app locally or in staging and capture the final set below.

## Recommended final screenshot set

Keep the folder lean. Capture the clearest representative screens rather than dozens of redundant states.

| File name | Viewport | Demonstrates |
| --- | --- | --- |
| `01-home--1440x900.png` | desktop | Public homepage, value proposition, primary CTA. |
| `02-features--1440x900.png` | desktop | Public feature overview. |
| `03-how-it-works--1440x900.png` | desktop | Input → segmentation → detection → scoring/report workflow. |
| `04-login--1440x900.png` | desktop | Auth card and login flow. |
| `05-signup--1440x900.png` | desktop | Signup flow and verification-oriented auth UI. |
| `06-dashboard--1440x900.png` | desktop | Aggregate statistics, charts, recent analyses. |
| `07-analyzer-input--1440x900.png` | desktop | Text analyzer form with realistic SRS sample content. |
| `08-analysis-result--1440x900.png` | desktop | Deterministic score, categories, requirement cards, issue explanations. |
| `09-analysis-report--1440x900.png` | desktop | Saved report route `/analysis/[id]`, score/health/category sections. |
| `10-history--1440x900.png` | desktop | Search/filter/sort/paginated saved analyses. |
| `11-settings-profile--1440x900.png` | desktop | Profile/password/privacy/delete account sections. |
| `12-ai-provider-settings--1440x900.png` | desktop | AI provider management using masked demo data only. |
| `13-document-upload--1440x900.png` | desktop | Upload tab/dropzone for PDF/DOCX/TXT. |
| `14-document-result--1440x900.png` | desktop | Document-based analysis result with file metadata. |
| `15-mobile-analyzer--390x844.png` | mobile | Analyzer/responsive layout at phone width. |
| `16-tablet-report--768x1024.png` | tablet | Report/responsive layout at tablet width. |

Optional if space permits: resources page, password reset, email verification, and AI-enhanced result state.

## Safe demo content

Use a demonstration account only, for example `demo@example.com`, and never use real credentials or provider keys in screenshots.

Sample SRS text:

```text
FR-001: The system shall allow many users to log in quickly.
FR-002: It shall generate reports as needed.
FR-003: The dashboard should be user-friendly and always available.
FR-004: Payment details shall be processed and/or stored securely.
FR-005: The report shall be approved before release.
```

This sample intentionally triggers multiple deterministic categories without exposing private data.

## Capture procedure

1. Start PostgreSQL and run migrations.
2. Start the backend:
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. Open `http://localhost:3000` in a browser.
5. Register/verify a demo account. In local development, use the console/file email outbox documented in `backend/.env.example`.
6. Create at least one text analysis and one document analysis using safe sample content.
7. Capture the recommended screenshots at approximately 390px, 768px, and 1440px widths.
8. Inspect every image before committing.

## Privacy checklist before committing screenshots

Do not commit screenshots containing:

- real email addresses;
- API keys or provider secrets;
- cookies/tokens/reset links;
- database URLs;
- internal production hostnames/IPs;
- real uploaded documents;
- personal data;
- browser devtools or debug overlays.

If a screenshot contains any sensitive value, delete and recapture it with safe demo data.
