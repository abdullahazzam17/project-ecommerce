from collections import defaultdict, deque
from time import monotonic
from typing import Deque, Dict

# Limiter in-memory per proses. Cocok untuk satu instance demo.
# Untuk multi-instance, ganti dengan Redis/Upstash.
_BUCKETS: Dict[str, Deque[float]] = defaultdict(deque)


def allow(key: str, limit: int, window_seconds: int) -> bool:
    now = monotonic()
    bucket = _BUCKETS[key]
    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    return True


def client_key(request, scope: str) -> str:
    # Render/Cloudflare menaruh IP asli di X-Forwarded-For. Nilai ini bisa
    # dipalsukan jika tidak berada di belakang proxy tepercaya.
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    host = forwarded or (request.client.host if request.client else "unknown")
    return f"{scope}:{host}"
