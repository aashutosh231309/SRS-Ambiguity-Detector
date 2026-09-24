"""Document upload orchestration (API_CONTRACT §4.4, Stage 08; list + purge +
signed downloads Stage 19).

HTTP-free: the router streams multipart bytes through `read()` and this module
owns everything else — bounded staging → validate → extract (worker thread +
timeout) → shared analysis pipeline → transactional persist (document + the
FULL analysis graph) → safe dataclasses out. Nothing persists on any failure;
temp files are removed in `finally` (success moves them into storage first).
Stage 19 siblings: newest-first list, owner purge (row + object; referencing
analyses survive via `SET NULL`), and signed-URL mint + byte serving (bytes
re-verified against the stored sha256 before they leave the building).

Ordering notes (all deliberate):
- Validate+extract run BEFORE any DB transaction (a 60 s parse must never hold
  one) and OUTSIDE it (zero I/O overlap with the commit window).
- The storage object lands BEFORE the DB commit; a commit failure best-effort
  deletes it. (Orphaned binary >> row-without-binary: the former is inert and
  reaped by key inspection, the latter corrupts a live row.)
- On timeout the worker thread is abandoned (CPython cannot kill threads) but
  the REQUEST fails fast with 503 — bounded input keeps the stray work small.

Logs carry ids + counts only — filenames are safe metadata, but file CONTENT
(text or bytes) is NEVER logged (SECURITY_SPEC §2.5).
"""

from __future__ import annotations

import asyncio
import hashlib
import os
import tempfile
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.security import create_document_download_token, utcnow
from app.documents import (
    ExtractedDocument,
    ValidatedUpload,
    extract_text,
    validate_staged_file,
)
from app.exceptions import (
    DocumentProcessingTimeoutError,
    FileTooLargeError,
    InternalError,
    NotFoundError,
)
from app.models.document import Document
from app.repositories.documents import DocumentRepository
from app.schemas.analysis import TITLE_MAX_LENGTH
from app.services.analysis import AnalysisDetail, DocumentRef, analyze_text
from app.services.transactions import transactional
from app.storage import get_storage_backend, storage_key_for_document

logger = get_logger(__name__)

# Streaming chunk (memory held per read — total bounded by MAX_UPLOAD_SIZE_BYTES).
_READ_CHUNK_BYTES = 65536


@dataclass(frozen=True)
class DocumentDetail:
    """One persisted upload (metadata only — the binary stays in storage,
    the key stays server-side)."""

    id: uuid.UUID
    filename: str
    file_type: str
    mime_type: str
    byte_size: int
    sha256: str
    extracted_chars: int
    extraction_status: str
    created_at: datetime


def _validate_and_extract(
    staged: Path,
    *,
    filename: object,
    content_type: object,
    byte_size: int,
    sha256_hex: str,
    max_chars: int,
) -> tuple[ValidatedUpload, ExtractedDocument]:
    """Sync validate→extract unit (runs in a worker thread under a timeout;
    directly unit-testable without HTTP or a database)."""
    validated = validate_staged_file(
        staged,
        filename=filename,
        declared_mime=content_type,
        byte_size=byte_size,
        sha256=sha256_hex,
    )
    extracted = extract_text(staged, file_type=validated.file_type, max_chars=max_chars)
    return validated, extracted


def _write_all(fd: int, chunk: bytes) -> None:
    """Full-write one chunk (os.write may partial-write). Runs in a worker
    thread — never inline in the event loop."""
    view = memoryview(chunk)
    while view:
        written = os.write(fd, view)
        view = view[written:]


async def _stage_upload(
    read: Callable[[int], Awaitable[bytes]], *, max_bytes: int
) -> tuple[Path, int, str]:
    """Stream the upload to a 0600 temp file, enforcing the byte budget on
    the TRUE count (declared sizes are untrusted). Chunk writes run in worker
    threads (no sustained blocking I/O in the loop); one-shot syscalls
    (mkstemp/unlink) stay inline — microseconds each. Returns (path, bytes,
    hex-sha256) — the caller owns cleanup (`finally`, missing_ok)."""
    fd, tmp_name = tempfile.mkstemp(prefix="srs-upload-")
    staged = Path(tmp_name)
    digest = hashlib.sha256()
    byte_size = 0
    try:
        while True:
            chunk = await read(_READ_CHUNK_BYTES)
            if not chunk:
                break
            byte_size += len(chunk)
            if byte_size > max_bytes:
                raise FileTooLargeError(max_bytes)
            digest.update(chunk)
            await asyncio.to_thread(_write_all, fd, chunk)
    except BaseException:
        await asyncio.to_thread(os.close, fd)
        staged.unlink(missing_ok=True)
        raise
    await asyncio.to_thread(os.close, fd)
    return staged, byte_size, digest.hexdigest()


@transactional
async def _persist_upload(
    session: AsyncSession,
    *,
    owner_id: uuid.UUID,
    document_id: uuid.UUID,
    storage_key: str,
    title: str | None,
    validated: ValidatedUpload,
    extracted: ExtractedDocument,
) -> tuple[DocumentDetail, AnalysisDetail]:
    """One transaction: document row + the FULL analysis graph via the shared
    `analyze_text` core (identical scoring to pasted text — the equivalence
    guarantee). Any failure rolls everything back (storage cleanup is the
    caller's job — the DB cannot reach object storage)."""
    doc = await DocumentRepository(session).create(
        id=document_id,
        owner_id=owner_id,
        filename=validated.filename,
        file_type=validated.file_type,
        mime_type=validated.mime_type,
        byte_size=validated.byte_size,
        sha256=validated.sha256,
        storage_path=storage_key,
        extracted_chars=len(extracted.text),
    )
    analysis = await analyze_text(
        session,
        owner_id=owner_id,
        title=title,
        text=extracted.text,
        source_type="document",
        document_id=document_id,
    )
    # Upload/GET parity: the analysis half carries the same source pointer a
    # later GET resolves from the row (filename/type already validated here).
    analysis = replace(
        analysis,
        document=DocumentRef(filename=validated.filename, file_type=validated.file_type),
    )
    return (
        DocumentDetail(
            id=doc.id,
            filename=doc.filename,
            file_type=validated.file_type,  # just wrote it — the row echoes it
            mime_type=doc.mime_type,
            byte_size=doc.byte_size,
            sha256=doc.sha256,
            extracted_chars=len(extracted.text),
            extraction_status=doc.extraction_status,
            created_at=doc.created_at,
        ),
        analysis,
    )


async def upload_and_analyze(
    session: AsyncSession,
    *,
    owner_id: uuid.UUID,
    filename: object,
    content_type: object,
    read: Callable[[int], Awaitable[bytes]],
    title: str | None,
    ai_enhance: bool = False,
) -> tuple[DocumentDetail, AnalysisDetail]:
    """Full pipeline: stream → validate → extract → analyze → persist.
    Raises AppError (safe codes); any failure leaves no rows, no objects, no
    temp files. NOT @transactional itself — `_persist_upload` owns the (short)
    commit window after all slow work is done; the OPTIONAL AI step (Stage 14)
    runs after that commit, same as the TEXT path (shared enhancement call)."""
    settings = get_settings()
    backend = get_storage_backend()
    staged, byte_size, sha256_hex = await _stage_upload(
        read, max_bytes=settings.MAX_UPLOAD_SIZE_BYTES
    )
    try:
        try:
            async with asyncio.timeout(settings.DOCUMENT_PROCESSING_TIMEOUT_SECONDS):
                validated, extracted = await asyncio.to_thread(
                    _validate_and_extract,
                    staged,
                    filename=filename,
                    content_type=content_type,
                    byte_size=byte_size,
                    sha256_hex=sha256_hex,
                    max_chars=settings.MAX_EXTRACTED_TEXT_CHARS,
                )
        except TimeoutError:
            raise DocumentProcessingTimeoutError() from None
        # Title: explicit form value wins; else the sanitized filename (ours to
        # truncate — user titles were length-checked at the boundary already).
        resolved_title = (title or "").strip() or validated.filename
        resolved_title = resolved_title[:TITLE_MAX_LENGTH]
        document_id = uuid.uuid4()
        storage_key = storage_key_for_document(owner_id, document_id)
        backend.store_file(storage_key, staged)
        try:
            document, analysis = await _persist_upload(
                session,
                owner_id=owner_id,
                document_id=document_id,
                storage_key=storage_key,
                title=resolved_title,
                validated=validated,
                extracted=extracted,
            )
        except BaseException:
            backend.delete(storage_key)  # commit failed: don't strand the object
            raise
    finally:
        staged.unlink(missing_ok=True)  # moved into storage on success; else scrap
    logger.info(
        "document analyzed document_id=%s owner_id=%s type=%s bytes=%d chars=%d "
        "requirements=%d issues=%d score=%s",
        document.id,
        owner_id,
        validated.file_type,
        validated.byte_size,
        len(extracted.text),
        analysis.requirements_count,
        analysis.issues_count,
        analysis.score,
    )
    # Same post-commit AI step as the TEXT path (lazy import matches the
    # TEXT orchestrator — provider-adjacent imports stay out of module scope).
    from app.services.ai_enhancement import enhance_analysis

    analysis = await enhance_analysis(
        session, owner_id=owner_id, detail=analysis, ai_enhance=ai_enhance
    )
    return document, analysis


def _to_detail(doc: Document) -> DocumentDetail:
    """Row → metadata dataclass (shared by the detail + list paths)."""
    # Invariant: NULL file_type/extracted_chars predate uploads, but no code
    # path could write a documents row before Stage 08 — impossible in practice.
    assert doc.file_type is not None and doc.extracted_chars is not None
    return DocumentDetail(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        mime_type=doc.mime_type,
        byte_size=doc.byte_size,
        sha256=doc.sha256,
        extracted_chars=doc.extracted_chars,
        extraction_status=doc.extraction_status,
        created_at=doc.created_at,
    )


async def get_document_detail(
    session: AsyncSession, *, owner_id: uuid.UUID, document_id: uuid.UUID
) -> DocumentDetail:
    """One owned document's metadata (404 unless owned — IDOR rule).
    Read-only: no transaction boundary needed."""
    doc = await DocumentRepository(session).get_owned(owner_id=owner_id, document_id=document_id)
    if doc is None:
        raise NotFoundError("document")
    return _to_detail(doc)


async def list_documents(
    session: AsyncSession, *, owner_id: uuid.UUID, page: int, page_size: int
) -> tuple[list[DocumentDetail], int]:
    """Newest-first page of owned documents + total (contract §3 envelope).
    Read-only: no transaction boundary needed."""
    rows, total = await DocumentRepository(session).list_owned(
        owner_id=owner_id,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    return [_to_detail(row) for row in rows], total


@transactional
async def delete_document(
    session: AsyncSession, *, owner_id: uuid.UUID, document_id: uuid.UUID
) -> None:
    """Purge one owned document: row + storage object (404 unless owned).

    Referencing analyses SURVIVE — the FK is `SET NULL`, and the detail +
    history paths already degrade the `document` pointer to None (their
    persisted requirements/issues/scores never needed the binary). Rows go
    first with storage inside the same transaction (the orphan-purge
    ordering: a storage failure rolls the rows back; only a commit failure
    after a storage delete could strand a row — rare, logged,
    metadata-intact).
    """
    doc = await DocumentRepository(session).get_owned(owner_id=owner_id, document_id=document_id)
    if doc is None:
        raise NotFoundError("document")
    await DocumentRepository(session).delete(doc)
    get_storage_backend().delete(doc.storage_path)
    logger.info("document purged document_id=%s owner_id=%s", document_id, owner_id)


@dataclass(frozen=True)
class DocumentBytes:
    """One owned document's binary, ready to serve (Stage 19 download)."""

    data: bytes
    filename: str
    mime_type: str


async def mint_download_url(
    session: AsyncSession, *, owner_id: uuid.UUID, document_id: uuid.UUID
) -> tuple[str, datetime]:
    """Mint a short-lived signed download URL (404 unless owned — IDOR).

    Returns the origin-RELATIVE path (prefix included — clients resolve it
    against the API origin; the backend claims no public origin of its own)
    plus the absolute expiry. Read-only + sign: no transaction needed. The
    token is single-document and short-lived (DOCUMENT_DOWNLOAD_URL_MINUTES,
    spec-capped at 15) — and it is NEVER logged (see the caller contract).
    """
    doc = await DocumentRepository(session).get_owned(owner_id=owner_id, document_id=document_id)
    if doc is None:
        raise NotFoundError("document")
    ttl_minutes = get_settings().DOCUMENT_DOWNLOAD_URL_MINUTES
    token = create_document_download_token(owner_id, document_id, ttl_minutes)
    expires_at = utcnow() + timedelta(minutes=ttl_minutes)
    prefix = get_settings().API_V1_PREFIX.rstrip("/")
    url = f"{prefix}/documents/{document_id}/download?token={token}"
    logger.info("download URL minted document_id=%s owner_id=%s", document_id, owner_id)
    return url, expires_at


async def read_document_bytes(
    session: AsyncSession, *, owner_id: uuid.UUID, document_id: uuid.UUID
) -> DocumentBytes:
    """Serve-path read: owned row → integrity-checked bytes (404 unless owned).

    The bytes are re-hashed against the stored sha256 before release — a
    missing object or a digest mismatch is OUR inconsistency (500, logged
    with ids only), never the user's 404. Read-only: no transaction needed.
    """
    doc = await DocumentRepository(session).get_owned(owner_id=owner_id, document_id=document_id)
    if doc is None:
        raise NotFoundError("document")
    try:
        data = get_storage_backend().read_bytes(doc.storage_path)
    except (OSError, ValueError):
        logger.error("download bytes missing document_id=%s owner_id=%s", document_id, owner_id)
        raise InternalError("The file is temporarily unavailable.") from None
    if hashlib.sha256(data).hexdigest() != doc.sha256:
        logger.error("download bytes corrupt document_id=%s owner_id=%s", document_id, owner_id)
        raise InternalError("The file is temporarily unavailable.") from None
    return DocumentBytes(data=data, filename=doc.filename, mime_type=doc.mime_type)
