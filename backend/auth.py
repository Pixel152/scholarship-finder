from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone

import jwt
import psycopg2
import psycopg2.errors

_SECRET     = os.getenv("JWT_SECRET", "scholarmatch-dev-secret-change-in-prod")
_ALG        = "HS256"
_TOKEN_DAYS = 30


def _db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def init_db() -> None:
    conn = _db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id            SERIAL PRIMARY KEY,
                    email         TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    profile_json  TEXT,
                    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()
    finally:
        conn.close()


def _hash(password: str) -> str:
    salt = os.urandom(32)
    key  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return base64.b64encode(salt + key).decode()


def _verify(password: str, stored: str) -> bool:
    try:
        raw        = base64.b64decode(stored.encode())
        salt, key  = raw[:32], raw[32:]
        new        = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
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
    conn = _db()
    try:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
                    (email, _hash(password)),
                )
                user_id = cur.fetchone()[0]
                conn.commit()
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                raise AuthError("An account with that email already exists.")
    finally:
        conn.close()
    return {"token": _token(user_id, email), "email": email}


def login(email: str, password: str) -> dict:
    email = email.lower().strip()
    conn = _db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, password_hash, profile_json FROM users WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    if not row or not _verify(password, row[1]):
        raise AuthError("Invalid email or password.")
    user_id, _, profile_json = row
    profile = json.loads(profile_json) if profile_json else None
    return {"token": _token(user_id, email), "email": email, "profile": profile}


def save_profile(token: str, profile: dict) -> None:
    payload = verify_token(token)
    if not payload:
        raise AuthError("Invalid or expired token.")
    conn = _db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET profile_json = %s WHERE id = %s",
                (json.dumps(profile), int(payload["sub"])),
            )
        conn.commit()
    finally:
        conn.close()


def get_profile(token: str) -> dict | None:
    payload = verify_token(token)
    if not payload:
        raise AuthError("Invalid or expired token.")
    conn = _db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT profile_json FROM users WHERE id = %s",
                (int(payload["sub"]),),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    if not row or not row[0]:
        return None
    return json.loads(row[0])
