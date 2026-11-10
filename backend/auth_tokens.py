import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional

# Token user ditandatangani server. Tidak disimpan di DB, sehingga tidak perlu
# tabel sesi tambahan. Wajib set USER_TOKEN_SECRET (>= 32 karakter) di production.
DEFAULT_TTL = int(os.getenv("USER_TOKEN_TTL_SECONDS", "604800"))


def _secret() -> bytes:
    secret = os.getenv("USER_TOKEN_SECRET", "")
    if len(secret) < 32:
        raise RuntimeError("USER_TOKEN_SECRET minimal 32 karakter dan wajib diset.")
    return secret.encode("utf-8")


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def issue_user_token(user_id: int, ttl_seconds: Optional[int] = None) -> str:
    payload = {
        "uid": int(user_id),
        "exp": int(time.time()) + int(ttl_seconds or DEFAULT_TTL),
    }
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(_secret(), body.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def verify_user_token(token: str) -> Optional[int]:
    try:
        body, signature = token.split(".", 1)
        expected = hmac.new(_secret(), body.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(_b64decode(body))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        user_id = int(payload.get("uid", 0))
        return user_id if user_id > 0 else None
    except Exception:
        return None
