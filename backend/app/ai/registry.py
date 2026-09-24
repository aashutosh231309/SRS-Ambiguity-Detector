"""Provider registry (AI_PROVIDER_SPEC §4): static metadata + adapter seam.

Metadata is trusted server-side data — `base_url` values are allowlisted
constants (never user input: SSRF rule) and display names live here so API
responses can stay on stable machine ids. Live adapters register in Stage 18;
until then `get_adapter` returns None and credential checks deterministically
report unavailable (the service seam + tests exercise this path via fakes).
Adding provider #7 = adapter + metadata row + docs + tests — no router,
service, or rendering changes.
"""

from dataclasses import dataclass

from app.ai.providers import AIProvider

# Registry order (§4 table) — doubles as the user-facing list order.
PROVIDER_IDS = ("gemini", "groq", "openai", "anthropic", "openrouter", "huggingface")

PROVIDER_ORDER = {provider_id: index for index, provider_id in enumerate(PROVIDER_IDS)}


@dataclass(frozen=True)
class ProviderMetadata:
    """Public, non-secret provider facts (safe to log and to document)."""

    id: str
    display_name: str
    base_url: str


PROVIDER_METADATA: dict[str, ProviderMetadata] = {
    "gemini": ProviderMetadata(
        id="gemini",
        display_name="Google Gemini",
        base_url="https://generativelanguage.googleapis.com",
    ),
    "groq": ProviderMetadata(id="groq", display_name="Groq", base_url="https://api.groq.com"),
    "openai": ProviderMetadata(
        id="openai", display_name="OpenAI", base_url="https://api.openai.com"
    ),
    "anthropic": ProviderMetadata(
        id="anthropic", display_name="Anthropic", base_url="https://api.anthropic.com"
    ),
    "openrouter": ProviderMetadata(
        id="openrouter", display_name="OpenRouter", base_url="https://openrouter.ai"
    ),
    "huggingface": ProviderMetadata(
        id="huggingface",
        display_name="Hugging Face",
        base_url="https://api-inference.huggingface.co",
    ),
}


def is_supported_provider(provider_id: str) -> bool:
    return provider_id in PROVIDER_METADATA


_adapters: dict[str, AIProvider] = {}


def register_adapter(adapter: AIProvider) -> None:
    """Plug a live adapter in (Stage 18 adapters + test fakes share this)."""
    if not is_supported_provider(adapter.id):
        raise ValueError(f"cannot register adapter for unknown provider: {adapter.id!r}")
    _adapters[adapter.id] = adapter


def unregister_adapter(provider_id: str) -> None:
    """Remove an adapter (tests only — production never unregisters)."""
    _adapters.pop(provider_id, None)


def get_adapter(provider_id: str) -> AIProvider | None:
    """Live adapter iff one registered (None until Stage 18 adapters land)."""
    return _adapters.get(provider_id)
