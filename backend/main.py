import json
import os
import threading
from pathlib import Path
from queue import Empty, Queue
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from agent import run_agent
from auth import AuthError, init_db, signup, login, save_profile, get_profile, verify_token
from student_profile import StudentProfile

# Walk up from backend/ to find the .env (works locally and on Render)
for _candidate in [Path(__file__).parent / ".env", Path(__file__).parent.parent.parent / ".env"]:
    if _candidate.exists():
        load_dotenv(_candidate, override=True)
        break

init_db()

_REQUIRED_ENV = ["ANTHROPIC_API_KEY", "NIMBLE_API_KEY"]
_missing = [k for k in _REQUIRED_ENV if not os.getenv(k)]
if _missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="ScholarMatch API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)


class ProfileRequest(BaseModel):
    name: str
    year: str
    university: str
    major: str
    gpa: Optional[float] = None
    intended_profession: str = ""
    hometown_city: str
    hometown_state: str
    hometown_county: str = ""
    state_of_residence: str = ""
    high_school: str = ""
    high_school_state: str = ""
    citizenship: str
    heritage: str = ""
    religion: str = ""
    languages: List[str] = []
    first_gen: bool = False
    financial_need: bool = False
    income_bracket: str = ""
    military_family: bool = False
    disability: str = ""
    activities: List[str] = []
    national_club_orgs: List[str] = []
    honors: List[str] = []
    parent_employer: str = ""
    parent_industry: str = ""
    parent_union: str = ""
    career_goal: str = ""
    already_applied: List[str] = []


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/search")
def search_scholarships(body: ProfileRequest):
    profile = StudentProfile(**body.model_dump())
    nimble_key = os.getenv("NIMBLE_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

    def generate():
        q: Queue = Queue()

        def run():
            try:
                run_agent(profile, nimble_key, anthropic_key, q)
            except Exception as e:
                q.put({"type": "error", "message": str(e)})
            finally:
                q.put(None)

        thread = threading.Thread(target=run, daemon=True)
        thread.start()

        while True:
            try:
                event = q.get(timeout=120)
                if event is None:
                    break
                yield f"data: {json.dumps(event)}\n\n"
            except Empty:
                yield 'data: {"type":"heartbeat"}\n\n'

        thread.join()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Auth endpoints ────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str

class ProfileSaveRequest(BaseModel):
    profile: dict


@app.post("/api/auth/signup")
@limiter.limit("10/minute")
def auth_signup(request: Request, body: AuthRequest):
    try:
        return signup(body.email, body.password)
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login")
@limiter.limit("10/minute")
def auth_login(request: Request, body: AuthRequest):
    try:
        return login(body.email, body.password)
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/api/auth/profile")
def auth_get_profile(authorization: str = Header(default="")):
    token = authorization.removeprefix("Bearer ").strip()
    try:
        profile = get_profile(token)
        return {"profile": profile}
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.put("/api/auth/profile")
def auth_save_profile(body: ProfileSaveRequest, authorization: str = Header(default="")):
    token = authorization.removeprefix("Bearer ").strip()
    try:
        save_profile(token, body.profile)
        return {"ok": True}
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
