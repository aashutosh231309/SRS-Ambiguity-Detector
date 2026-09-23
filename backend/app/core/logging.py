"""Structured logging with aggressive secret redaction.

``RedactingFilter`` scrubs sensitive key=value pairs and bearer tokens from every log
record. Installed in :func:`configure_logging`, which ``app.main`` calls at startup —
before any request is handled. See ``docs/SECURITY_SPEC.md`` §2.5.
"""

import logging
import re
import sys

_REDACTED = "***REDACTED***"

_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    # api_key=..., "password": "...", secret:'...', token = ... etc.
    (
        re.compile(
            r"(?i)(api[_-]?key|password|passwd|pwd|secret|token|authorization|cookie"
            r"|set-cookie|access[_-]?token|refresh[_-]?token|client[_-]?secret)"
            r"(\s*[:=]\s*)([\"']?)([^\s,;\"'}\]]+)\3"
        ),
        r"\1\2\3" + _REDACTED + r"\3",
    ),
    # Authorization: Bearer <token> / raw "Bearer <token>" fragments.
    (re.compile(r"(?i)(Bearer\s+)[A-Za-z0-9\-._~+/]+=*"), r"\1" + _REDACTED),
)


def redact(text: str) -> str:
    """Redact secret-looking fragments from an already-rendered string."""
    for pattern, replacement in _PATTERNS:
        text = pattern.sub(replacement, text)
    return text


class RedactingFilter(logging.Filter):
    """Logging filter that redacts secrets from the formatted record message."""

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            rendered = record.getMessage()
        except Exception:  # pragma: no cover - never break logging itself
            return True
        scrubbed = redact(rendered)
        if scrubbed != rendered:
            record.msg = scrubbed
            record.args = ()
        return True


def configure_logging(level: str = "INFO") -> None:
    """Install a single stdout handler with the redacting filter (idempotent)."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    for handler in root.handlers:
        handler.addFilter(RedactingFilter())
    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s %(levelname)s [%(name)s] [req=%(request_id)s] %(message)s",
                defaults={"request_id": "-"},
            )
        )
        handler.addFilter(RedactingFilter())
        root.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Return a module logger (redaction is applied at the handler level)."""
    return logging.getLogger(name)
