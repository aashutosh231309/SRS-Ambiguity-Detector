"""Single source of truth for provider model ids (Stage 14).

Every adapter reads its generation default + curated discovery list from
here — no model ids live in adapter code, services, or the frontend, and
there is deliberately NO model-management UI (AI_PROVIDER_SPEC §4 keeps
provider #7 = adapter + registry row + this table + docs + tests).

`default` is the model generation calls use. `supported` is the curated
list `list_models` returns WITHOUT network I/O (a stable allowlist, not
a live account capability probe — keys with narrower access fail at
generation time with a user-safe provider error, never here).
Deferred providers (anthropic, huggingface — no adapter yet) have NO row:
`default_model`/`supported_models` raise `ValueError` for them, and the
enhancement chain treats adapter-less credentials as unusable (recorded
in the Stage 14 AI_PROVIDER_SPEC notes, not silently).
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderModels:
    """Generation default + curated discovery list for one provider."""

    default: str
    supported: tuple[str, ...]


PROVIDER_MODELS: dict[str, ProviderModels] = {
    "openai": ProviderModels(
        default="gpt-4o-mini",
        supported=("gpt-4o-mini", "gpt-4o"),
    ),
    "groq": ProviderModels(
        default="llama-3.3-70b-versatile",
        supported=("llama-3.3-70b-versatile", "llama-3.1-8b-instant"),
    ),
    "openrouter": ProviderModels(
        default="openai/gpt-4o-mini",
        supported=(
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.1-8b-instruct",
            "google/gemini-flash-1.5",
        ),
    ),
    "gemini": ProviderModels(
        default="gemini-2.0-flash",
        supported=("gemini-2.0-flash", "gemini-1.5-flash"),
    ),
}


def default_model(provider_id: str) -> str:
    """Generation default for a supported provider (ValueError otherwise)."""
    try:
        return PROVIDER_MODELS[provider_id].default
    except KeyError:
        raise ValueError(f"no model table row for provider: {provider_id!r}") from None


def supported_models(provider_id: str) -> tuple[str, ...]:
    """Curated discovery list for a supported provider (ValueError otherwise)."""
    try:
        return PROVIDER_MODELS[provider_id].supported
    except KeyError:
        raise ValueError(f"no model table row for provider: {provider_id!r}") from None
