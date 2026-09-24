"""Storage port: binaries live here, metadata in Postgres (DATABASE_SCHEMA §3.5).

Keys are server-generated opaque paths (`documents/{user_id}/{document_id}/source`)
— never user input, never exposed to clients. The Stage 08 surface is minimal on
purpose: store (upload), delete (cleanup/cascade). Reads/signed URLs arrive with
the download stages — no fake surface ships early.
"""

from __future__ import annotations

from pathlib import Path
from typing import Protocol


class StorageBackend(Protocol):
    """Object-store port. Implementations MUST confine every key under their
    root (defense in depth — keys are server-built, but a confused caller
    must never escape the bucket)."""

    def store_file(self, key: str, src: Path) -> None:
        """Persist `src` under `key` (implementations SHOULD move, not copy —
        the staged temp file becomes the stored object)."""
        ...

    def delete(self, key: str) -> None:
        """Remove `key`; a missing key is a no-op (idempotent cleanup)."""
        ...
