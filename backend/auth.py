from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import jwt

DB_PATH   = Path(__file__).parent / "users.db"
_SECRET   = os.getenv("JWT_SECRET", "scholarmatch-dev-secret-change-in-prod")
_ALG      = "HS256"
_TOKEN_DAYS = 30


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                email        TEXT    UNIQUE NOT NULL,
                password_hash TEXT   NOT NULL,
                profile_json TEXT,
                created_at   TEXT    DEFAULT CURRENT_TIMESTAMP
            )
        """)


def _hash(password: str) -> str:
    salt = os.urandom(32)
    key  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return base64.b64encode(salt + key).decode()


def _verify(password: str, stored: str) -> bool:
    try:
        raw  = base64.b64decode(stored.encode())
        salt, key = raw[:32], raw[32:]
        new  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
        return hmac.compare_digest(key, new)
    except Exception:
        return False


def _token(user_id: int, email: str) -> str:
    payload = {
        "sub":   str(user_id),
        "email": email,
        "exp":   datetime.now(timezone.utc) + timedelta(days=_TOKEN_DAYS),
    }
    return jwt.encode(payload, _SECRET, algorithm=_ALG)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _SECRET, algorithms=[_ALG])
    except Exception:
        return None


# ── public API ────────────────────────────────────────────────────────────────

class AuthError(Exception):
    pass


def signup(email: str, password: str) -> dict:
    email = email.lower().strip()
    if len(password) < 6:
        raise AuthError("Password must be at least 6 characters.")
    with sqlite3.connect(DB_PATH) as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id",
                (email, _hash(password)),
            )
            user_id = cur.fetchone()[0]
        except sqlite3.IntegrityError:
            raise AuthError("An account with that email already exists.")
    return {"token": _token(user_id, email), "email": email}


def login(email: str, password: str) -> dict:
    email = email.lower().strip()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT id, password_hash, profile_json FROM users WHERE email = ?",
            (email,),
        ).fetchone()
    if not row or not _verify(password, row[1]):
        raise AuthError("Invalid email or password.")
    user_id, _, profile_json = row
    profile = json.loads(profile_json) if profile_json else None
    return {"token": _token(user_id, email), "email": email, "profile": profile}


def save_profile(token: str, profile: dict) -> None:
    payload = verify_token(token)
    if not payload:
        raise AuthError("Invalid or expired token.")
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE users SET profile_json = ? WHERE id = ?",
            (json.dumps(profile), int(payload["sub"])),
        )


def get_profile(token: str) -> dict | None:
    payload = verify_token(token)
    if not payload:
        raise AuthError("Invalid or expired token.")
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT profile_json FROM users WHERE id = ?",
            (int(payload["sub"]),),
        ).fetchone()
    if not row or not row[0]:
        return None
    return json.loads(row[0])
