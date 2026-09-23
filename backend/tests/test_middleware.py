"""Request-ID + access-log middleware (no DB)."""

import logging
from collections.abc import Generator
from contextlib import contextmanager

from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())


def test_request_id_generated_and_echoed() -> None:
    res = client.get("/api/v1/health/live")
    assert res.status_code == 200
    request_id = res.headers.get("X-Request-ID")
    assert request_id and len(request_id) == 12


def test_request_id_preserved() -> None:
    res = client.get("/api/v1/health/live", headers={"X-Request-ID": "trace-123"})
    assert res.headers["X-Request-ID"] == "trace-123"


@contextmanager
def _access_log_records() -> Generator[list[logging.LogRecord], None, None]:
    """Capture `app.main` records directly (immune to root-handler/propagation setup)."""
    records: list[logging.LogRecord] = []

    class _Capture(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            records.append(record)

    handler = _Capture(level=logging.INFO)
    logger = logging.getLogger("app.main")
    old_level = logger.level
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
    try:
        yield records
    finally:
        logger.removeHandler(handler)
        logger.setLevel(old_level)


def test_access_log_records_method_path_status() -> None:
    with _access_log_records() as records:
        res = client.get("/api/v1/health/live")
    assert res.status_code == 200
    lines = [r.getMessage() for r in records]
    assert any("GET /api/v1/health/live -> 200" in line for line in lines)


def test_access_log_never_logs_query_params() -> None:
    with _access_log_records() as records:
        res = client.get("/api/v1/health/live", params={"token": "secret-abc"})
    assert res.status_code == 200
    assert records, "expected access log lines"
    assert all(
        "secret-abc" not in line and "token=" not in line
        for line in (r.getMessage() for r in records)
    )
