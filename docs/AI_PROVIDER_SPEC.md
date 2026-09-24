# AI Provider Specification

> **Status:** CONTRACT as of Stage 01. No provider code exists yet. Stage 17 builds the vault
> + ABC, Stage 18 adds providers, Stage 19 wires overview/improvements, Stage 20 hardens
> fallback/errors. This file fixes the interface so Stages 07/13 can already design the
> `ai_*` fields and empty states around it.

## 1. Principles

1. AI is OPTIONAL and user-funded: users bring their own keys; the app never pays for
   inference and never requires a key for core analysis.
2. One abstraction, many adapters. No provider-specific code outside `backend/app/ai/`
   + this spec's registry.
3. Fail open: AI timeout/error/quota/invalid-key NEVER fails the analysis; deterministic
   result persists with `ai_status` + retry affordance.
4. Least data: only the requirement text (and finding summaries) needed for the task are
   sent; never credentials, never other users' data, never full documents when excerpts do.
5. No key exfiltration: keys decrypt in backend memory, go only to the configured
   provider's HTTPS endpoint, and are redacted from every log/error/Sentry event.

## 2. Provider abstraction (binding interface — IMPLEMENTED Stage 12 in `app/ai/providers.py`)

> As-built Stage 12: the ABC + payload/result models (`ProviderError`,
> `ProviderAuthResult`, `ProviderHealth`, `FindingSummary`, `OverviewPayload`,
> `ImprovementPayload`, `AITextResult` with the §3 caps) ship exactly as
> specified below. NO adapters yet — Stage 18 owns them; the service seam +
> test fakes exercise the interface meanwhile.

```python
class AIProvider(ABC):
    id: str                      # "gemini" | "groq" | "openai" | "anthropic" | "openrouter" | "huggingface"
    display_name: str
    base_url: str                # allowlisted host per provider (no user-supplied hosts in v1)

    async def validate_credentials(self, api_key: str) -> ProviderAuthResult: ...
    async def health_check(self, api_key: str) -> ProviderHealth: ...
    async def list_models(self, api_key: str) -> list[str]: ...
    async def generate_overview(self, api_key: str, payload: OverviewPayload, *, timeout_s: int) -> AITextResult: ...
    async def generate_improvement(self, api_key: str, payload: ImprovementPayload, *, timeout_s: int) -> AITextResult: ...
```

- `timeout_s` default 25 s, hard cap 60 s (configurable env). All calls run with
  `httpx.AsyncClient` + explicit timeout + retry ONLY on 429/5xx with jittered backoff (max 2).
- Errors normalize to `ProviderError(code: "auth"|"quota"|"timeout"|"bad_response"|"unavailable", user_message: str)` —
  raw provider bodies are NEVER propagated.
- Payloads are Pydantic models with char caps; prompts live in `backend/app/ai/prompts/`
  (versioned, reviewed for injection resistance — finding text is DELIMITED, never
  interpolated as instructions).

## 3. Payload design (deterministic context in, constrained text out)

- `OverviewPayload`: `{analysis_id, score, band, top_findings: [{category, severity, phrase, reason} × ≤12], requirements_count, issues_count}` — NOT full raw text by default.
- `ImprovementPayload`: `{requirement_text (≤4 000 chars), findings: [{phrase, category, reason, recommendation} × ≤8]}`.
- `AITextResult`: `{text (≤8 000 chars, truncated with marker), model, latency_ms, usage?}`.
- Output handling: treat as UNTRUSTED (sanitize before render, cap length, strip control
  chars). Prompt-injection note: requirement text may contain instructions ("ignore previous…");
  prompts frame it as quoted data; overview endpoint never executes tool calls.

## 4. Provider registry (metadata IMPLEMENTED Stage 12; adapters Stage 18; order + scope locked)

> As-built Stage 12 (`app/ai/registry.py`): the six ids, display names,
> allowlisted `base_url` constants (server-side only — never user input),
> registry order, and the `register/get_adapter` seam are live; the adapter
> map is EMPTY until Stage 18. Adding provider #7 is still adapter +
> metadata row + docs + tests — no router/service/rendering changes.

| # | Provider | Adapter | Notes |
|---|----------|---------|-------|
| 1 | `gemini` | `GeminiProvider` | Google AI Studio / Vertex-compatible REST; default model env-configurable |
| 2 | `groq` | `GroqProvider` | OpenAI-compatible chat endpoint, Groq host allowlist |
| 3 | `openai` | `OpenAIProvider` | api.openai.com allowlist |
| 4 | `anthropic` | `AnthropicProvider` | api.anthropic.com, versioned headers |
| 5 | `openrouter` | `OpenRouterProvider` | openrouter.ai, `HTTP-Referer` = site URL |
| 6 | `huggingface` | `HuggingFaceProvider` | Inference API, model allowlist |

Adding provider #7 = new adapter + registry row + docs + tests. No changes to
routers/services/rendering. "Other compatible providers where practical" (master prompt)
means OpenAI-compatible hosts ONLY via explicit allowlist additions, never arbitrary URLs.

## 5. Credential lifecycle (vault IMPLEMENTED Stage 12; live-proof + UX in Stage 16/18/19)

> As-built Stage 12: creation is SHAPE-only (strip, 4–2000 chars) — the live
> `validate_credentials` proof waits for Stage 18 adapters (a key that fails
> proof then returns `provider_error` with a user-safe message and stores
> nothing). TEST runs the full decrypt → adapter → sanitize → record flow
> through the registry seam, but with no adapters registered it
> deterministically returns `200 {ok:false}` + an unavailable message and
> leaves `last_test_*` untouched.

- Add: `POST /ai/providers {provider, label?, api_key}` → server validates shape →
  (Stage 18: `validate_credentials` against provider — proves the key works) →
  Fernet-encrypt → store `{encrypted_key, fingerprint, last4}` → return metadata
  WITHOUT key. Always `is_enabled=true`, `is_default=false` (NO auto-default).
- Display: `••••••••••••7A91` (last4 only) + provider + label + status. Full key NEVER
  re-displayed; "change" = `rotate-key` (new ciphertext, new fingerprint, verdict cleared).
- Default + fallback: exactly one `is_default` per user (partial unique index +
  same-transaction claim-move; races → `409`); `fallback_rank` orders the chain.
  (Stage 19: enhancement tries default → fallbacks in rank order → records which
  provider succeeded.)
- Remove: row deleted immediately; in-flight calls finish with the in-memory key only.
- Test: `POST /ai/providers/{id}/test` decrypts → `health_check` (+ `list_models` on
  success) → updates `last_tested_at/status`. Dedicated 10/min bucket (expensive op);
  no transaction spans the network I/O. Disabled credentials still test (the check
  validates key material, not routing state).

## 6. Discovery UX (binding — Stages 05/13/16 implement)

1. **Settings → AI Providers → Add Provider** (full management surface —
   IMPLEMENTED Stage 13 as `/settings`: list/add/test/enable/default/
   replace/remove on the §4.6 API; test verdict `error` renders verbatim
   as backend-curated user-safe data, never as an error envelope).
2. **Post-registration nudge:** after verification, inform that core detection works
   without AI; offer `Configure AI Provider` / `Maybe Later`. NEVER blocks app use.
3. **Result-page empty states:** when unconfigured, the AI Overview + AI Improvements
   sections show explicit copy ("AI enhancement isn't configured yet…") with buttons
   routing to Settings. When configured-but-failed: error card + `Retry AI` (calls
   `retry-ai`, deterministic findings stay visible throughout).

## 7. Failure behavior matrix (Stage 20 tests each row)

| Failure | `ai_status` | UX |
|---------|-------------|----|
| No provider configured | `unconfigured` | Empty-state + CTA (not an error) |
| Invalid key (401/403) | `failed` | "Key rejected — check/update key" + link to provider row |
| Quota / 429 | `failed` | "Quota exceeded — retry later / try fallback" + Retry |
| Timeout | `failed` | "Provider timed out" + Retry |
| Bad response / parse fail | `failed` | "Unexpected provider response" + Retry |
| Provider down / DNS | `failed` | "Provider unavailable" + Retry |
| User ran with `ai_enhance:false` | `skipped` | Neutral note, no CTA spam |

Fallback chain: on per-provider failure, try next ranked provider (max chain = 3 attempts);
record `attempted_providers[]` in response meta for transparency.

## 8. Privacy & disclosure

- Settings + result pages disclose: which provider + model was used, what text was sent
  (requirement excerpts / finding summaries), and that provider-side retention follows the
  PROVIDER's policy, not ours.
- Data minimization: overview uses finding summaries (default), never full documents;
  improvement sends one requirement at a time. No batching across users, no cross-user cache.
- Logs/Sentry: record provider id, model, latency, error code — NEVER prompts, outputs,
  or keys.

## 9. Cost guardrails

- Per-user AI rate limits (Stage 22): `retry-ai` and `test` are the abuse surface.
- Hard caps: overview ≤ 1 call/analysis-run (plus explicit retries); improvement ≤ 1 call
  per requirement per explicit user action (no auto-fan-out across 500 requirements —
  batch or require confirmation; Stage 19 decides UX, this cap is the rule).
- Token budgets: payload caps (§3) + `max_tokens` per call; usage recorded when reported.
