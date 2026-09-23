"""Application errors → uniform envelope (docs/API_CONTRACT.md §2).

Services raise these; main.py maps them to HTTP. Messages are user-safe by
construction — never interpolate SQL, DSNs, or raw driver text into them.
"""

from __future__ import annotations


class AppError(Exception):
    """Base: stable machine code + safe message + HTTP status + optional details."""

    def __init__(
        self, code: str, message: str, status_code: int = 500, details: object = None
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class NotFoundError(AppError):
    """404 with a per-resource code. Doubles as the IDOR response (no oracle)."""

    def __init__(self, resource: str) -> None:
        super().__init__(f"{resource}_not_found", "The requested resource was not found.", 404)


class ConflictError(AppError):
    """409 — duplicate / state conflict (code + message supplied by the service)."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(code, message, 409)


class UnauthorizedError(AppError):
    """401 — missing/invalid session (wired to auth in Stage 04)."""

    def __init__(self, message: str = "Authentication required.") -> None:
        super().__init__("unauthenticated", message, 401)


class ForbiddenError(AppError):
    """403 — authenticated but not allowed (ownership checks from Stage 04)."""

    def __init__(self, message: str = "You do not have access to this resource.") -> None:
        super().__init__("forbidden", message, 403)
