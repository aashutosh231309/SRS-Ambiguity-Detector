"""Application factory + process-level wiring.

Owns: settings, logging, middleware (request-id, security headers, CORS),
the uniform error envelope (``docs/API_CONTRACT.md`` §2), and router mounting.
Feature code lives in ``app/api/``, ``app/services/``, etc. — never here.
"""

import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger

logger = get_logger(__name__)

_STATUS_TO_CODE = {
    status.HTTP_400_BAD_REQUEST: "bad_request",
    status.HTTP_401_UNAUTHORIZED: "unauthenticated",
    status.HTTP_403_FORBIDDEN: "forbidden",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_409_CONFLICT: "conflict",
    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE: "payload_too_large",
    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: "unsupported_media_type",
    status.HTTP_422_UNPROCESSABLE_ENTITY: "unprocessable_file",
    status.HTTP_429_TOO_MANY_REQUESTS: "rate_limited",
}


def error_envelope(code: str, message: str, details: object = None) -> dict[str, object]:
    """Build the uniform error body from ``docs/API_CONTRACT.md`` §2."""
    return {"error": {"code": code, "message": message, "details": details}}


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL)

    docs_kwargs: dict[str, str | None] = (
        {"docs_url": "/api/docs", "redoc_url": "/api/redoc", "openapi_url": "/api/openapi.json"}
        if not settings.is_production
        else {"docs_url": None, "redoc_url": None, "openapi_url": None}
    )

    app = FastAPI(
        title=settings.APP_NAME,
        version=__version__,
        debug=settings.DEBUG and not settings.is_production,
        **docs_kwargs,  # type: ignore[arg-type]
    )

    @app.middleware("http")
    async def request_id_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex[:12])
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.middleware("http")
    async def security_headers_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _STATUS_TO_CODE.get(exc.status_code, "internal_error")
        message = str(exc.detail) if exc.status_code < 500 else "Internal server error."
        return JSONResponse(status_code=exc.status_code, content=error_envelope(code, message))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Contract: schema failures are 400 + "validation_error" (422 is reserved for
        # semantically-unprocessable FILES, e.g. extraction failures). Details are
        # field-level locators only — never echo secrets (Pydantic already masks SecretStr).
        details = [
            {"loc": list(err.get("loc", [])), "msg": err.get("msg", "invalid")}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_envelope("validation_error", "Request validation failed.", details),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "-")
        logger.exception("Unhandled exception", extra={"request_id": request_id})
        _ = exc  # never serialized — no internals leak (SECURITY_SPEC §2.5)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_envelope("internal_error", "Internal server error."),
        )

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "service": "srs-ambiguity-detector",
            "version": __version__,
            "docs": "/api/docs",
        }

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_app()
