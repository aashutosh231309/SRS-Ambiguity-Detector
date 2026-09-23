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


class InvalidCredentialsError(AppError):
    """401 — bad email/password (identical message for unknown email: no oracle)."""

    def __init__(self) -> None:
        super().__init__("invalid_credentials", "Invalid email or password.", 401)


class EmailNotVerifiedError(AppError):
    """403 — session valid but email unverified (verified-user gate)."""

    def __init__(self) -> None:
        super().__init__("email_unverified", "Please verify your email to continue.", 403)


class AccountDisabledError(AppError):
    """403 — password correct but account deactivated (post-auth, no oracle)."""

    def __init__(self) -> None:
        super().__init__("account_disabled", "This account has been disabled.", 403)


class InvalidTokenError(AppError):
    """400 — token unknown/expired/consumed. Honest errors are safe here: 256-bit
    tokens are not enumerable, so there is no oracle."""

    def __init__(self, message: str = "This link is invalid or has expired.") -> None:
        super().__init__("invalid_token", message, 400)


class WeakPasswordError(AppError):
    """400 — password fails policy beyond length (denylist)."""

    def __init__(self, message: str = "This password is too easy to guess.") -> None:
        super().__init__("password_too_weak", message, 400)


class RateLimitedError(AppError):
    """429 — auth rate bucket exhausted (main.py adds the Retry-After header)."""

    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__("rate_limited", "Too many attempts. Please try again shortly.", 429)
        self.retry_after_seconds = retry_after_seconds


class CurrentPasswordError(AppError):
    """400 — wrong current password on change (authenticated: honesty is safe)."""

    def __init__(self) -> None:
        super().__init__("current_password_incorrect", "Current password is incorrect.", 400)
