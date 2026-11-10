"""
Request rate limiting.

Counts live in this process, which matches how the backend is deployed: one
uvicorn worker behind Caddy. Running several workers or replicas would need a
shared store instead.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import settings

_limits: list["RateLimit"] = []


def client_ip(request: Request) -> str:
    """Address of the caller as the reverse proxy saw it."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Caddy appends the address it accepted the connection from, so the
        # last entry is the only one the caller cannot forge.
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


class RateLimit:
    """Allow `limit` requests per `window_seconds` for each key.

    Use as a route dependency to limit by caller address, or call `check`
    with your own key (for example a user id).
    """

    def __init__(self, scope: str, limit: int, window_seconds: int):
        self.scope = scope
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()
        _limits.append(self)

    def __call__(self, request: Request) -> None:
        self.check(client_ip(request))

    def check(self, key: str) -> None:
        if not settings.RATE_LIMIT_ENABLED:
            return
        now = time.monotonic()
        oldest_allowed = now - self.window_seconds
        with self._lock:
            hits = self._hits[key]
            while hits and hits[0] <= oldest_allowed:
                hits.popleft()
            if len(hits) >= self.limit:
                retry_after = max(1, int(hits[0] + self.window_seconds - now) + 1)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγο.",
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)
            if len(self._hits) > 10_000:
                self._forget_idle_keys(oldest_allowed)

    def _forget_idle_keys(self, oldest_allowed: float) -> None:
        for key in [k for k, hits in self._hits.items() if not hits or hits[-1] <= oldest_allowed]:
            del self._hits[key]

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def reset_all() -> None:
    """Forget every count. For tests."""
    for limit in _limits:
        limit.reset()


# Sign-in: slows password guessing from one address.
login_limit = RateLimit("login", limit=10, window_seconds=60)
# Each of these sends an email or creates an account.
register_limit = RateLimit("register", limit=5, window_seconds=3600)
email_request_limit = RateLimit("email-request", limit=5, window_seconds=3600)
# Token checks (verify email, reset password).
token_limit = RateLimit("token", limit=10, window_seconds=60)
# Assistant messages, per signed-in user: every message costs model usage.
chat_limit = RateLimit("chat", limit=20, window_seconds=300)
chat_daily_limit = RateLimit("chat-daily", limit=200, window_seconds=86400)
