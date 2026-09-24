"""Cloudflare Turnstile verification (Stage 22).

No live Cloudflare calls: the verifier's httpx client is replaced with a tiny
async fake. Endpoint tests monkeypatch the imported verifier in the auth router
so they prove integration/order without coupling to Cloudflare's transport.
"""

import os
import uuid
from collections.abc import Generator
from typing import Any

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.api.v1.endpoints import auth as auth_endpoint
from app.core.config import get_settings
from app.core.database import normalize_url
from app.core.rate_limit import reset_rate_limiter
from app.email.base import EmailMessage, EmailService
from app.exceptions import (
    TurnstileConfigurationError,
    TurnstileInvalidError,
    TurnstileRequiredError,
    TurnstileUnavailableError,
)
from app.main import create_app
from app.models import User
from app.services.turnstile import verify_turnstile_token
from tests.conftest import TEST_DATABASE_URL, db_test_session, run


class FakeEmailService(EmailService):
    def __init__(self) -> None:
        self.sent: list[EmailMessage] = []

    async def send(self, message: EmailMessage) -> None:
        self.sent.append(message)


@pytest.fixture(autouse=True)
def _fresh_rate_limiter() -> Generator[None, None, None]:
    reset_rate_limiter()
    yield
    reset_rate_limiter()


@pytest.fixture(autouse=True)
def _clean_db(migrated_db: str) -> Generator[None, None, None]:
    _ = migrated_db

    async def _truncate() -> None:
        async with db_test_session():
            pass

    run(_truncate())
    yield
    run(_truncate())


@pytest.fixture()
def turnstile_app(migrated_db: str) -> FastAPI:
    _ = migrated_db
    os.environ["JWT_SECRET"] = "stage22-test-jwt-secret-32-bytes-minimum"  # noqa: S105
    get_settings.cache_clear()
    app = create_app()
    app.state.email_service = FakeEmailService()
    return app


@pytest.fixture()
def turnstile_client(turnstile_app: FastAPI) -> Generator[TestClient, None, None]:
    with TestClient(turnstile_app) as client:
        yield client


def _email(tag: str) -> str:
    return f"stage22-{tag}-{uuid.uuid4().hex[:8]}@example.com"


def _pw(tag: str = "main") -> str:
    return f"correct-horse-stage22-{tag}-battery-99"


async def _verify_user(email: str) -> None:
    engine = create_async_engine(normalize_url(TEST_DATABASE_URL))
    try:
        async with AsyncSession(engine) as session:
            user = (await session.execute(select(User).where(User.email == email))).scalar_one()
            user.is_verified = True
            await session.commit()
    finally:
        await engine.dispose()


def _register(client: TestClient, email: str, captcha_response: str | None = "ok-token") -> Any:
    body: dict[str, object] = {"name": "Turn Style", "email": email, "password": _pw()}
    if captcha_response is not None:
        body["turnstile_token"] = captcha_response
    return client.post("/api/v1/auth/register", json=body)


class _FakeResponse:
    def __init__(self, *, status_code: int = 200, json_data: Any = None, content: bytes = b"{}"):
        self.status_code = status_code
        self._json_data = json_data if json_data is not None else {"success": True}
        self.content = content

    def json(self) -> Any:
        if isinstance(self._json_data, Exception):
            raise self._json_data
        return self._json_data


class _FakeClient:
    def __init__(self, response: _FakeResponse | None = None, exc: Exception | None = None) -> None:
        self.response = response or _FakeResponse()
        self.exc = exc
        self.posts: list[dict[str, str]] = []

    async def __aenter__(self) -> "_FakeClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def post(self, _: str, *, data: dict[str, str]) -> _FakeResponse:
        self.posts.append(data)
        if self.exc is not None:
            raise self.exc
        return self.response


def _enable_turnstile(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TURNSTILE_ENABLED", "true")
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "test-secret")
    get_settings.cache_clear()


@pytest.mark.parametrize("env", ["local", "staging"])
def test_disabled_turnstile_noops_outside_production(
    monkeypatch: pytest.MonkeyPatch, env: str
) -> None:
    monkeypatch.setenv("APP_ENV", env)
    monkeypatch.setenv("TURNSTILE_ENABLED", "false")
    get_settings.cache_clear()
    run(verify_turnstile_token(None, remote_ip="203.0.113.1"))


def test_disabled_turnstile_fails_closed_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("TURNSTILE_ENABLED", "false")
    get_settings.cache_clear()
    with pytest.raises(TurnstileConfigurationError):
        run(verify_turnstile_token("token", remote_ip=None))


def test_enabled_turnstile_requires_complete_config(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TURNSTILE_ENABLED", "true")
    monkeypatch.delenv("TURNSTILE_SECRET_KEY", raising=False)
    get_settings.cache_clear()
    with pytest.raises(TurnstileConfigurationError):
        run(verify_turnstile_token("token", remote_ip=None))


def test_enabled_turnstile_requires_token(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_turnstile(monkeypatch)
    with pytest.raises(TurnstileRequiredError):
        run(verify_turnstile_token("  ", remote_ip=None))


def test_valid_token_posts_secret_response_and_remoteip(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_turnstile(monkeypatch)
    fake = _FakeClient(_FakeResponse(json_data={"success": True}, content=b'{"success":true}'))
    monkeypatch.setattr("app.services.turnstile.httpx.AsyncClient", lambda **_: fake)
    run(verify_turnstile_token(" client-token ", remote_ip="203.0.113.8"))
    assert fake.posts == [
        {"secret": "test-secret", "response": "client-token", "remoteip": "203.0.113.8"}
    ]


def test_invalid_token_is_stable_app_error(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_turnstile(monkeypatch)
    fake = _FakeClient(_FakeResponse(json_data={"success": False}, content=b'{"success":false}'))
    monkeypatch.setattr("app.services.turnstile.httpx.AsyncClient", lambda **_: fake)
    with pytest.raises(TurnstileInvalidError):
        run(verify_turnstile_token("bad", remote_ip=None))


@pytest.mark.parametrize(
    ("response", "exc"),
    [
        (_FakeResponse(status_code=500, content=b"oops"), None),
        (_FakeResponse(json_data=ValueError("no json"), content=b"not-json"), None),
        (_FakeResponse(json_data=[], content=b"[]"), None),
        (_FakeResponse(json_data={"ok": True}, content=b'{"ok":true}'), None),
        (_FakeResponse(json_data={"success": True}, content=b"x" * 20_000), None),
        (None, httpx.TimeoutException("timeout")),
        (None, httpx.ConnectError("connect")),
    ],
)
def test_provider_failures_fail_closed(
    monkeypatch: pytest.MonkeyPatch,
    response: _FakeResponse | None,
    exc: Exception | None,
) -> None:
    _enable_turnstile(monkeypatch)
    fake = _FakeClient(response, exc)
    monkeypatch.setattr("app.services.turnstile.httpx.AsyncClient", lambda **_: fake)
    with pytest.raises(TurnstileUnavailableError):
        run(verify_turnstile_token("token", remote_ip=None))


def test_register_requires_turnstile_when_router_verifier_rejects(
    turnstile_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def reject(_: str | None, *, remote_ip: str | None) -> None:
        assert remote_ip == "testclient"
        raise TurnstileRequiredError()

    monkeypatch.setattr(auth_endpoint, "verify_turnstile_token", reject)
    response = _register(turnstile_client, _email("missing"), captcha_response=None)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "turnstile_required"


def test_register_valid_turnstile_preserves_existing_flow(
    turnstile_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[str | None] = []

    async def accept(token: str | None, *, remote_ip: str | None) -> None:
        _ = remote_ip
        seen.append(token)

    monkeypatch.setattr(auth_endpoint, "verify_turnstile_token", accept)
    email = _email("ok")
    response = _register(turnstile_client, email, captcha_response="valid-token")
    assert response.status_code == 201
    assert response.json()["email"] == email
    assert not response.cookies.get("access_token")
    assert seen == ["valid-token"]


def test_public_auth_endpoints_call_turnstile_before_success(
    turnstile_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[str | None] = []

    async def accept(token: str | None, *, remote_ip: str | None) -> None:
        _ = remote_ip
        seen.append(token)

    monkeypatch.setattr(auth_endpoint, "verify_turnstile_token", accept)
    email = _email("journey")
    assert _register(turnstile_client, email, captcha_response="reg-token").status_code == 201
    run(_verify_user(email))
    assert (
        turnstile_client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": _pw(), "turnstile_token": "login-token"},
        ).status_code
        == 200
    )
    assert (
        turnstile_client.post(
            "/api/v1/auth/resend-verification",
            json={"email": email, "turnstile_token": "resend-token"},
        ).status_code
        == 202
    )
    assert (
        turnstile_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": email, "turnstile_token": "forgot-token"},
        ).status_code
        == 202
    )
    token = "x" * 32
    reset = turnstile_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": _pw("new"), "turnstile_token": "reset-token"},
    )
    assert reset.status_code == 400  # invalid reset token is still honest after Turnstile passes
    assert reset.json()["error"]["code"] == "invalid_token"
    assert seen == ["reg-token", "login-token", "resend-token", "forgot-token", "reset-token"]
