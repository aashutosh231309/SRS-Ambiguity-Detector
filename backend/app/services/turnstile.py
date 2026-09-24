"""Cloudflare Turnstile verification (SECURITY_SPEC §7, Stage 22).

Small integration boundary: routers pass only the opaque client token + socket
IP, this module owns configuration, Cloudflare HTTP, response parsing, and
stable app-level errors. It fails CLOSED for protected endpoints; no raw
Cloudflare payload, secret, token, or network details ever reach responses/logs.
"""

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.exceptions import (
    TurnstileConfigurationError,
    TurnstileInvalidError,
    TurnstileRequiredError,
    TurnstileUnavailableError,
)

logger = get_logger(__name__)

_RESPONSE_MAX_BYTES = 16_384


async def verify_turnstile_token(token: str | None, *, remote_ip: str | None) -> None:
    """Verify one client token for a protected public-auth action.

    Local/staging may explicitly disable Turnstile (default); production never
    bypasses — a disabled/missing configuration rejects protected requests.
    """
    settings = get_settings()
    if not settings.TURNSTILE_ENABLED:
        if settings.is_production:
            logger.error("turnstile disabled in production")
            raise TurnstileConfigurationError()
        return
    if not settings.TURNSTILE_SECRET_KEY:
        logger.error("turnstile enabled but missing server secret")
        raise TurnstileConfigurationError()
    token_n = (token or "").strip()
    if not token_n:
        raise TurnstileRequiredError()

    payload = {"secret": settings.TURNSTILE_SECRET_KEY, "response": token_n}
    if remote_ip:
        payload["remoteip"] = remote_ip
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(float(settings.TURNSTILE_TIMEOUT_SECONDS)),
            follow_redirects=False,
        ) as client:
            response = await client.post(settings.TURNSTILE_VERIFY_URL, data=payload)
            body = response.content[: _RESPONSE_MAX_BYTES + 1]
    except httpx.TimeoutException:
        logger.warning("turnstile verification timed out")
        raise TurnstileUnavailableError() from None
    except httpx.TransportError:
        logger.warning("turnstile verification transport failure")
        raise TurnstileUnavailableError() from None

    if response.status_code < 200 or response.status_code >= 300:
        logger.warning("turnstile verification http_status=%s", response.status_code)
        raise TurnstileUnavailableError()
    if len(body) > _RESPONSE_MAX_BYTES:
        logger.warning("turnstile verification response too large")
        raise TurnstileUnavailableError()
    try:
        data = response.json()
    except ValueError:
        logger.warning("turnstile verification returned non-json")
        raise TurnstileUnavailableError() from None
    if not isinstance(data, dict):
        logger.warning("turnstile verification returned non-object")
        raise TurnstileUnavailableError()
    success = data.get("success")
    if success is True:
        return
    if success is False:
        logger.info("turnstile token rejected")
        raise TurnstileInvalidError()
    logger.warning("turnstile verification missing success flag")
    raise TurnstileUnavailableError()


__all__ = ["verify_turnstile_token"]
