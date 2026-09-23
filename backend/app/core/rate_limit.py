"""Auth rate limiting: single-process token buckets (Stage 04 foundation).

Contract (SECURITY_SPEC §7): sensitive ops get per-key buckets with 429 +
Retry-After. The DISTRIBUTED store lands in Stage 22 — until then these buckets
are exact behind one worker and fail OPEN (N workers ≈ N× budget each holding a
full bucket). Env: RATE_LIMIT_ENABLED, RATE_LIMIT_AUTH_PER_MINUTE.

Keys are `{endpoint}:{client_socket_ip}` (never trust X-Forwarded-For here).
Bucket math need not be lock-step exact — worst case is slight over/under
counting, which is acceptable for a limiter (fail-open direction preferred).
"""

import time
from dataclasses import dataclass

from app.core.config import get_settings
from app.exceptions import RateLimitedError

_MAX_BUCKETS = 100_000  # memory cap; overflow clears (fail open, documented)


@dataclass
class _Bucket:
    tokens: float
    updated_at: float


_buckets: dict[str, _Bucket] = {}


def reset_rate_limiter() -> None:
    """Clear all buckets (tests only — production never calls this)."""
    _buckets.clear()


def check_rate_limit(key: str) -> None:
    """Consume one token from `key`'s per-minute bucket; raise 429 when empty."""
    settings = get_settings()
    if not settings.RATE_LIMIT_ENABLED:
        return
    limit = max(1, settings.RATE_LIMIT_AUTH_PER_MINUTE)
    now = time.monotonic()
    bucket = _buckets.get(key)
    if bucket is None:
        if len(_buckets) >= _MAX_BUCKETS:
            _buckets.clear()  # fail open under key-spray; see module docstring
        _buckets[key] = _Bucket(tokens=float(limit - 1), updated_at=now)
        return
    elapsed = now - bucket.updated_at
    bucket.tokens = min(float(limit), bucket.tokens + elapsed * (limit / 60.0))
    bucket.updated_at = now
    if bucket.tokens < 1.0:
        retry_after = int((1.0 - bucket.tokens) * (60.0 / limit)) + 1
        raise RateLimitedError(max(1, retry_after))
    bucket.tokens -= 1.0
