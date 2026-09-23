"""Health endpoints + uniform error envelope (docs/API_CONTRACT.md §2, §4.1)."""

from fastapi.testclient import TestClient

from app import __version__


def test_live_returns_ok_shape(client: TestClient) -> None:
    res = client.get("/api/v1/health/live")
    assert res.status_code == 200
    assert res.json() == {
        "status": "ok",
        "service": "srs-ambiguity-detector",
        "version": __version__,
    }
    assert res.headers["X-Request-ID"]  # request-id middleware active


def test_ready_reports_dependency_checks(client: TestClient) -> None:
    res = client.get("/api/v1/health/ready")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] in ("ready", "degraded")
    assert "database" in body["checks"]


def test_unknown_route_uses_error_envelope(client: TestClient) -> None:
    res = client.get("/api/v1/does-not-exist")
    assert res.status_code == 404
    assert res.json() == {"error": {"code": "not_found", "message": "Not Found", "details": None}}


def test_security_headers_present(client: TestClient) -> None:
    res = client.get("/api/v1/health/live")
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
