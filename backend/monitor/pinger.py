import time

import requests

from .models import Check

TIMEOUT_SECONDS = 5


def check_url(monitor_id: int, url: str) -> None:
    start = time.monotonic()
    try:
        response = requests.get(url, timeout=TIMEOUT_SECONDS, allow_redirects=True)
        response_ms = int((time.monotonic() - start) * 1000)
        is_up = 200 <= response.status_code < 400
        Check.objects.create(
            url_id=monitor_id,
            status_code=response.status_code,
            response_ms=response_ms,
            is_up=is_up,
        )
    except Exception as exc:
        # Anything can go wrong on the network (DNS, TLS, timeouts, or even
        # environment issues like a missing CA bundle) — every failure mode
        # should still record a "down" check, not silently leave it pending.
        Check.objects.create(
            url_id=monitor_id,
            status_code=None,
            response_ms=None,
            is_up=False,
            error_message=str(exc),
        )
