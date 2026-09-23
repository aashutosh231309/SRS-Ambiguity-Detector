"""Structured logging with aggressive secret redaction.

``RedactingFilter`` scrubs sensitive key=value pairs and bearer tokens from every log
record. Installed in :func:`configure_logging`, which ``app.main`` calls at startup —
before any request is handled. See ``docs/SECURITY_SPEC.md`` §2.5.
"""

import logging
import re
import sys

_REDACTED = "***REDACTED***"

_KEY_ALTERNATION = (
    r"api[_-]?key|password|passwd|pwd|secret|token|cookie"
    r"|set-cookie|access[_-]?token|refresh[_-]?token|client[_-]?secret"
)

# Authorization headers: redact the whole credential, preserving the scheme word.
#   Authorization: Bearer <tok>  →  Authorization: Bearer ***REDACTED***
_AUTH_HEADER_PATTERN = re.compile(
    r"(?i)([\"']?authorization[\"']?)(\s*[:=]\s*)(Bearer\s+)?\S+(?:\s+\S+)?"
)

# Generic pairs, incl. quoted JSON/Python keys and Bearer-prefixed values:
#   api_key=... / "password": "..." / 'token': '...' / secret:'...'
# The trailing \4 consumes the closing value-quote so it isn't duplicated.
_PAIR_PATTERN = re.compile(
    rf"(?i)([\"']?)({_KEY_ALTERNATION})\1(\s*[:=]\s*)([\"']?)(Bearer\s+)?([^\s,;\"'}}\]]+)\4"
)

# Bare "Bearer <token>" fragments outside any key context.
_BEARER_PATTERN = re.compile(r"(?i)(Bearer\s+)[A-Za-z0-9\-._~+/]+=*")


def _scrub_pair(match: re.Match[str]) -> str:
    """Rebuild a key=value match with the value redacted (quotes/scheme preserved)."""
    key_quote, key, sep, val_quote, bearer, _value = match.groups()
    scheme = "Bearer " if bearer else ""
    return f"{key_quote}{key}{key_quote}{sep}{val_quote}{scheme}{_REDACTED}{val_quote}"


def redact(text: str) -> str:
    """Redact secret-looking fragments from an already-rendered string."""
    text = _AUTH_HEADER_PATTERN.sub(r"\1\2\3" + _REDACTED, text)
    text = _PAIR_PATTERN.sub(_scrub_pair, text)
    text = _BEARER_PATTERN.sub(r"\1" + _REDACTED, text)
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
