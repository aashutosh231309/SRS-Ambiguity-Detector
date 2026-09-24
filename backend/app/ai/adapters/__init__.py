"""Production provider adapters (Stage 14: 4 of 6 — see the deferral note).

`BUILTIN_ADAPTERS` holds one stateless singleton per IMPLEMENTED provider;
`registry.resolve_adapter` serves these unless a test fake shadows the id.
Anthropic + Hugging Face have registry metadata but NO adapter (distinct
REST shapes deferred deliberately — enhancement + TEST report them as
unavailable-with-guidance, never as silent gaps; AI_PROVIDER_SPEC §4
records the deferral and the re-entry rule).
"""

from app.ai.adapters.gemini import GeminiProvider
from app.ai.adapters.groq import GroqProvider
from app.ai.adapters.openai import OpenAIProvider
from app.ai.adapters.openrouter import OpenRouterProvider
from app.ai.providers import AIProvider

BUILTIN_ADAPTERS: dict[str, AIProvider] = {
    adapter.id: adapter
    for adapter in (
        GeminiProvider(),
        GroqProvider(),
        OpenAIProvider(),
        OpenRouterProvider(),
    )
}

__all__ = [
    "BUILTIN_ADAPTERS",
    "GeminiProvider",
    "GroqProvider",
    "OpenAIProvider",
    "OpenRouterProvider",
]
