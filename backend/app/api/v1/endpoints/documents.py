"""Document endpoints (API_CONTRACT §4.4 — Stage 08: upload+analyze, metadata read).

Thin: guards (verified identity + CSRF + per-user upload bucket on POST,
identity-only on the safe GET) → service → response. `POST /upload` analyzes
EXACTLY one file per call (sync pipeline — bounded request, honest 503 past
the processing budget); extra `file` parts are rejected, never silently
dropped. Reads are owner-scoped: foreign ids 404 exactly like missing ones.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_current_verified_user, verified_user_guard
from app.api.v1.presenters import detail_response
from app.core.config import get_settings
from app.core.database import get_session
from app.exceptions import TooManyFilesError
from app.schemas.analysis import TITLE_MAX_LENGTH
from app.schemas.documents import DocumentResponse, DocumentUploadResponse
from app.services import documents as documents_service
from app.services.auth import UserInfo
from app.services.documents import DocumentDetail

router = APIRouter(prefix="/documents", tags=["documents"])

# Uploads are resource-intensive: tighter per-user budget than text posts.
upload_guard = verified_user_guard(
    "documents:upload", limit=lambda: get_settings().RATE_LIMIT_UPLOADS_PER_MINUTE
)


def _document_response(item: DocumentDetail) -> DocumentResponse:
    # Metadata only — storage key / binary / extracted text never serialize.
    if item.file_type not in ("pdf", "docx", "txt"):
        raise ValueError(f"unexpected file type: {item.file_type!r}")
    if item.extraction_status not in ("pending", "ok", "failed"):
        raise ValueError(f"unexpected extraction status: {item.extraction_status!r}")
    return DocumentResponse(
        id=item.id,
        filename=item.filename,
        file_type=item.file_type,  # type: ignore[arg-type]  # narrowed above
        mime_type=item.mime_type,
        byte_size=item.byte_size,
        sha256=item.sha256,
        extracted_chars=item.extracted_chars,
        extraction_status=item.extraction_status,  # type: ignore[arg-type]  # ditto
        created_at=item.created_at,
    )


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    files: Annotated[list[UploadFile], File(...)],
    user: Annotated[UserInfo, Depends(upload_guard)],
    session: Annotated[AsyncSession, Depends(get_session)],
    title: Annotated[str | None, Form(max_length=TITLE_MAX_LENGTH)] = None,
    ai_enhance: Annotated[bool, Form()] = False,
) -> DocumentUploadResponse:
    """Upload one SRS file (pdf/docx/txt) → validate → extract → run the SAME
    deterministic pipeline as pasted text → 201 `{document, analysis}`.
    `ai_enhance` (Stage 14) opts the shared post-commit AI step in."""
    max_files = get_settings().MAX_FILES_PER_REQUEST
    if len(files) > max_files:
        raise TooManyFilesError(max_files)
    if not files:  # unreachable: File(...) required → 400 validation_error
        raise TooManyFilesError(max_files)  # pragma: no cover - defensive
    # NOTE: exactly one file is processed (files[0]). If MAX_FILES_PER_REQUEST
    # is ever raised, this endpoint must grow real multi-file support — the
    # `> max_files` gate above is what keeps extra parts from silent dropping.
    upload = files[0]
    try:
        document, analysis = await documents_service.upload_and_analyze(
            session,
            owner_id=user.id,
            filename=upload.filename,
            content_type=upload.content_type,
            read=upload.read,
            title=title,
            ai_enhance=ai_enhance,
        )
    finally:
        await upload.close()  # releases the multipart spool file, always
    return DocumentUploadResponse(
        document=_document_response(document), analysis=detail_response(analysis)
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    user: Annotated[UserInfo, Depends(get_current_verified_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DocumentResponse:
    """One owned document's metadata (binary/downloads arrive later — §4.4)."""
    detail = await documents_service.get_document_detail(
        session, owner_id=user.id, document_id=document_id
    )
    return _document_response(detail)
