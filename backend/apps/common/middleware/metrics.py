import threading
import time
from collections import deque
from typing import Deque

_LOCK = threading.Lock()
_LATENCY_BUCKET: Deque[float] = deque(maxlen=2048)
_TOTAL_COUNTER: dict = {"requests": 0, "errors_4xx": 0, "errors_5xx": 0}


def metrics_snapshot() -> dict:
    with _LOCK:
        latencies = sorted(_LATENCY_BUCKET)
        total = _TOTAL_COUNTER["requests"]
        errors_4xx = _TOTAL_COUNTER["errors_4xx"]
        errors_5xx = _TOTAL_COUNTER["errors_5xx"]

    if not latencies:
        return {
            "total_requests": total,
            "errors_4xx": errors_4xx,
            "errors_5xx": errors_5xx,
            "samples": 0,
            "latency_p50_ms": 0.0,
            "latency_p95_ms": 0.0,
            "latency_p99_ms": 0.0,
            "latency_max_ms": 0.0,
        }

    def percentile(ordered: list[float], pct: float) -> float:
        if not ordered:
            return 0.0
        index = max(0, min(len(ordered) - 1, int(len(ordered) * pct / 100)))
        return ordered[index]

    return {
        "total_requests": total,
        "errors_4xx": errors_4xx,
        "errors_5xx": errors_5xx,
        "samples": len(latencies),
        "latency_p50_ms": round(percentile(latencies, 50), 2),
        "latency_p95_ms": round(percentile(latencies, 95), 2),
        "latency_p99_ms": round(percentile(latencies, 99), 2),
        "latency_max_ms": round(latencies[-1], 2),
    }


class RequestMetricsMiddleware:
    """Records request count + latency into an in-memory ring buffer.

    Read via `metrics_snapshot()` or the `/api/v1/metrics/` endpoint. Skips itself
    so the metrics call doesn't poison its own samples.
    """

    EXCLUDE_PATH_PREFIXES = ("/api/v1/metrics", "/static/", "/media/")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started = time.perf_counter()
        response = self.get_response(request)

        path = request.path or ""
        if any(path.startswith(prefix) for prefix in self.EXCLUDE_PATH_PREFIXES):
            return response

        elapsed_ms = (time.perf_counter() - started) * 1000.0
        status_code = getattr(response, "status_code", 200)

        with _LOCK:
            _LATENCY_BUCKET.append(elapsed_ms)
            _TOTAL_COUNTER["requests"] += 1
            if 400 <= status_code < 500:
                _TOTAL_COUNTER["errors_4xx"] += 1
            elif status_code >= 500:
                _TOTAL_COUNTER["errors_5xx"] += 1

        return response
