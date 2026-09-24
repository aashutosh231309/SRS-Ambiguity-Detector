# API Overview

The backend exposes a versioned FastAPI REST API under `/api/v1`. Non-production environments also expose generated OpenAPI documentation at `/api/docs` and `/api/openapi.json`; production disables those docs.

All authenticated browser calls use HttpOnly cookies with `credentials: include`. Errors use the uniform envelope documented in `docs/API_CONTRACT.md`:

```json
{ "error": { "code": "validation_error", "message": "...", "details": null } }
```

## Route groups

| Group | Auth | Purpose |
| --- | --- | --- |
| `/health` | public | Liveness and readiness checks. |
| `/auth` | mixed | Registration, login, refresh, verification, password reset, logout, account deletion. |
| `/analysis` | verified user | Text analysis, saved reports, history list, delete, AI retry. |
| `/documents` | verified user | Upload/analyze, document metadata list/read/delete, signed download URLs. |
| `/dashboard` | verified user | Aggregate statistics for the authenticated user. |
| `/ai/providers` | verified user | User-owned AI provider credential management and test operations. |
| `/settings` | verified user | Profile and privacy settings. |
| `/privacy` | verified user | Live privacy export and purge actions. |

## Important endpoints

### Health

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Unversioned infrastructure liveness alias. |
| `GET` | `/api/v1/health/live` | Process liveness. |
| `GET` | `/api/v1/health/ready` | Dependency readiness with safe DB status only. |

### Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create account and send verification email. Synthetic success avoids enumeration. |
| `POST` | `/api/v1/auth/login` | Login and set access/refresh cookies. |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh cookie and issue a new access cookie. |
| `POST` | `/api/v1/auth/logout` | Clear cookies and revoke refresh token. |
| `GET` | `/api/v1/auth/me` | Return current session identity. |
| `POST` | `/api/v1/auth/verify-email` | Verify email token and start session. |
| `POST` | `/api/v1/auth/resend-verification` | Re-send verification email without enumeration. |
| `POST` | `/api/v1/auth/forgot-password` | Send reset link without enumeration. |
| `POST` | `/api/v1/auth/reset-password` | Reset password with one-time token. |
| `POST` | `/api/v1/auth/change-password` | Change password for current user. |
| `DELETE` | `/api/v1/auth/account` | Delete the current account and owned data. |

Public high-abuse auth endpoints support Cloudflare Turnstile tokens when configured.

### Analysis

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/analysis` | Analyze pasted text; optional `options.ai_enhance`. |
| `GET` | `/api/v1/analysis` | Paginated, filterable list of the user's analyses. |
| `GET` | `/api/v1/analysis/{analysis_id}` | Full report detail with requirements and nested findings. |
| `DELETE` | `/api/v1/analysis/{analysis_id}` | Delete an owned analysis. |
| `POST` | `/api/v1/analysis/{analysis_id}/retry-ai` | Re-run only the optional AI enhancement step. |

Foreign or missing ids return the same `404 analysis_not_found` to avoid IDOR oracles.

### Documents

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/documents/upload` | Upload exactly one PDF/DOCX/TXT, extract text, and run the shared analysis pipeline. |
| `GET` | `/api/v1/documents` | Paginated list of owned document metadata. |
| `GET` | `/api/v1/documents/{document_id}` | Owned document metadata only; storage path is never exposed. |
| `DELETE` | `/api/v1/documents/{document_id}` | Delete metadata and stored binary through the storage abstraction. |
| `POST` | `/api/v1/documents/{document_id}/download-url` | Mint a short-lived signed download URL. |
| `GET` | `/api/v1/documents/{document_id}/download?token=...` | Download original bytes using the signed token. |

Uploads enforce size, filename, extension, MIME, magic-byte, and extraction limits.

### Dashboard, settings, AI, privacy

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/dashboard` | User aggregate stats, distributions, trends, and recent analyses. |
| `GET/PATCH` | `/api/v1/settings/profile` | Read/update display name; email is read-only. |
| `GET/PATCH` | `/api/v1/settings/privacy` | Read/update retention preferences. |
| `GET/POST` | `/api/v1/ai/providers` | List or add user-owned encrypted AI provider credentials. |
| `POST` | `/api/v1/ai/providers/{id}/test` | Test a stored provider credential. |
| `PATCH` | `/api/v1/ai/providers/{id}` | Enable/disable/default/fallback/label updates. |
| `POST` | `/api/v1/ai/providers/{id}/rotate-key` | Replace a stored provider key. |
| `DELETE` | `/api/v1/ai/providers/{id}` | Remove a provider credential. |
| `POST` | `/api/v1/privacy/export` | Create a short-lived live export ticket. |
| `GET` | `/api/v1/privacy/export/{export_id}` | Download owner-scoped privacy export JSON. |
| `POST` | `/api/v1/privacy/purge-history` | Purge history according to retention settings. |

## Error behavior

Common responses:

- `400 validation_error` for malformed bodies/params and bad UUIDs.
- `401 unauthenticated` for missing/invalid sessions.
- `403 email_unverified` for product routes before email verification.
- `404 *_not_found` for missing or foreign resources.
- `409 conflict` for provider/key conflicts.
- `429 rate_limited` with `Retry-After`.
- `500 internal_error` for unexpected failures, without stack traces, SQL, DSNs, provider payloads, storage paths, prompts, or credentials.

For the complete schema contract, see `docs/API_CONTRACT.md` or generated OpenAPI in a non-production backend.
