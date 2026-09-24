"""File storage abstraction (local FS dev adapter; Supabase arrives with prod).

Feature code resolves the backend through :func:`get_storage_backend` and
programs to the `StorageBackend` protocol — no provider imports outside this
package (SECURITY_SPEC §5: storage details never leak into the engine).
"""

from __future__ import annotations

import uuid

from app.core.config import get_settings
from app.storage.base import StorageBackend
from app.storage.local import LocalStorageBackend

__all__ = [
    "LocalStorageBackend",
    "StorageBackend",
    "get_storage_backend",
    "storage_key_for_document",
]


def storage_key_for_document(owner_id: uuid.UUID, document_id: uuid.UUID) -> str:
    """Server-generated opaque object key (UUIDs only — no user input can
    reach a storage path, ever). Single convention: upload + delete agree."""
    return f"documents/{owner_id}/{document_id}/source"


def get_storage_backend() -> StorageBackend:
    """Resolve the configured backend (fail closed on unknown values)."""
    settings = get_settings()
    if settings.STORAGE_BACKEND == "local":
        return LocalStorageBackend(settings.STORAGE_LOCAL_DIR)
    raise RuntimeError(f"Unknown STORAGE_BACKEND: {settings.STORAGE_BACKEND!r}")
