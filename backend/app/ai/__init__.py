"""Optional AI enhancement: provider ABC + registry. Fail-open by contract.

Stage 12 lands the abstraction (`providers.AIProvider`), the metadata registry
(`registry`, no adapters yet), and the Fernet vault (`app.core.vault`).
Adapters arrive in Stage 18, generation in Stage 19 — no provider-specific
code may live outside this package + the registry table (AI_PROVIDER_SPEC §4).
"""
