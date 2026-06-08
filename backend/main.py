import asyncio
import base64
import json
import os
import threading
from pathlib import Path
from queue import Empty, Queue
from typing import List, Optional

import anthropic as anthropic_sdk
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from agent import run_agent
from auth import AuthError, init_db, signup, login, save_profile, get_profile, verify_token
from nimble_client import nimble_extract, nimble_extract_linkedin, nimble_search
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
    allow_headers=["Content-Type", "Authorization", "Accept"],
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
    extra_context: str = ""
    linkedin_url: str = ""
    website_url: str = ""
    portfolio_url: str = ""


@app.get("/api/health")
def health():
    return {"status": "ok"}


class DebugExtractRequest(BaseModel):
    url: str


@app.post("/api/debug-extract")
async def debug_extract(request: Request, body: DebugExtractRequest):
    """Returns the raw Nimble response for a URL — for debugging only."""
    nimble_key = os.getenv("NIMBLE_API_KEY", "")
    import requests as req_lib
    try:
        resp = await asyncio.to_thread(
            req_lib.post,
            "https://sdk.nimbleway.com/v1/extract",
            headers={"Authorization": f"Bearer {nimble_key}", "Content-Type": "application/json"},
            json={
                "url": body.url.strip(),
                "render": True,
                "driver": "vx8",
                "country": "US",
                "locale": "en-US",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            },
            timeout=50,
        )
        raw = resp.json()
        # Return top-level keys + content length + first 2000 chars of each text field
        def summarise(obj, depth=0):
            if depth > 3: return str(obj)[:200]
            if isinstance(obj, dict):
                return {k: summarise(v, depth+1) for k, v in obj.items()}
            if isinstance(obj, str):
                return {"len": len(obj), "preview": obj[:2000]}
            if isinstance(obj, list):
                return [summarise(i, depth+1) for i in obj[:3]]
            return obj
        return {"status": resp.status_code, "body": summarise(raw)}
    except Exception as e:
        return {"error": str(e)}


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


# ── Profile import via document / text ───────────────────────────────────────

_IMPORT_PROMPT = """Extract scholarship profile information from this document.
Return ONLY a JSON object — no explanation, no markdown, just raw JSON.

Return this exact structure:
{
  "profile": {
    "name": "full name",
    "university": "exact school name",
    "major": "field of study",
    "year": "freshman|sophomore|junior|senior|graduate",
    "gpa": 3.7,
    "intended_profession": "...",
    "hometown_city": "...",
    "hometown_state": "two-letter abbreviation",
    "hometown_county": "...",
    "high_school": "...",
    "citizenship": "us_citizen|permanent_resident|daca|international",
    "heritage": "ethnicity or cultural background if stated",
    "religion": "...",
    "languages": ["Spanish", "Mandarin"],
    "first_gen": true,
    "financial_need": true,
    "military_family": true,
    "activities": ["Soccer", "Debate team"],
    "national_club_orgs": ["Key Club", "DECA"],
    "honors": ["National Merit Semifinalist"],
    "parent_employer": "...",
    "parent_industry": "...",
    "parent_union": "...",
    "career_goal": "...",
    "income_bracket": "..."
  },
  "warnings": [
    "Guessed hometown_state as TX from mentioned city — verify if correct",
    "GPA listed as a range (3.5–3.8) — used midpoint 3.65"
  ]
}

  "extra_context": "A short narrative summary (2-5 sentences) of anything in the document that doesn't fit the structured fields above — ventures, research, personal story, work experience, unique background, etc. Leave empty string if nothing notable."
}

Rules:
- Only include profile fields where you found CLEAR information. Omit fields not present.
- extra_context should capture the human story, not repeat structured data.
- warnings array: flag inferred/guessed values or anything to double-check. Empty array if nothing uncertain.
- Return ONLY valid JSON."""


@app.post("/api/import-profile")
@limiter.limit("20/minute")
async def import_profile(
    request: Request,
    file: UploadFile = File(None),
    text: str = Form(None),
):
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    client = anthropic_sdk.Anthropic(api_key=anthropic_key)

    if file and file.filename:
        raw = await file.read()
        if len(raw) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

        content_type = file.content_type or ""
        is_pdf = content_type == "application/pdf" or file.filename.lower().endswith(".pdf")

        if is_pdf:
            b64 = base64.standard_b64encode(raw).decode()
            message_content = [
                {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": b64}},
                {"type": "text", "text": _IMPORT_PROMPT},
            ]
        else:
            # TXT or DOCX — treat as plain text
            try:
                doc_text = raw.decode("utf-8", errors="replace")
            except Exception:
                doc_text = raw.decode("latin-1", errors="replace")
            message_content = f"{_IMPORT_PROMPT}\n\nDocument text:\n{doc_text[:12000]}"

    elif text and text.strip():
        message_content = f"{_IMPORT_PROMPT}\n\nDocument text:\n{text.strip()[:12000]}"
    else:
        raise HTTPException(status_code=400, detail="Provide a file or text to import.")

    try:
        response = await asyncio.to_thread(
            client.messages.create,
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": message_content}],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    raw_text = response.content[0].text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not parse profile from document — try pasting text instead.")

    # Support both new {profile, warnings} shape and legacy flat shape
    if "profile" in parsed and isinstance(parsed["profile"], dict):
        return {"profile": parsed["profile"], "warnings": parsed.get("warnings", [])}
    else:
        return {"profile": parsed, "warnings": []}


class LinkedInImportRequest(BaseModel):
    url: str


@app.post("/api/import-linkedin")
@limiter.limit("10/minute")
async def import_linkedin(request: Request, body: LinkedInImportRequest):
    nimble_key    = os.getenv("NIMBLE_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

    url = body.url.strip()
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Please provide a valid URL starting with http:// or https://")

    is_linkedin = "linkedin.com/in/" in url

    if is_linkedin:
        # LinkedIn personal profiles are login-gated even for headless browsers.
        # Use Nimble Search to get Google's indexed snapshot of the profile instead.
        # Google indexes name, title, company, location, and bio snippet.
        username = url.rstrip("/").split("/in/")[-1].split("/")[0]
        queries = [
            f'site:linkedin.com/in/{username}',
            f'linkedin.com/in/{username}',
        ]
        snippets = []
        for q in queries:
            results = await asyncio.to_thread(nimble_search, q, nimble_key, 5)
            for r in results:
                parts = [r.get("title", ""), r.get("description", ""), r.get("url", "")]
                snippets.append(" | ".join(p for p in parts if p))
        page_text = "\n".join(snippets)
    else:
        page_text = await asyncio.to_thread(nimble_extract, url, nimble_key)

    if not page_text or len(page_text) < 50:
        raise HTTPException(status_code=422, detail="Could not find profile data for that URL.")

    client = anthropic_sdk.Anthropic(api_key=anthropic_key)
    try:
        response = await asyncio.to_thread(
            client.messages.create,
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": f"{_IMPORT_PROMPT}\n\nDocument text:\n{page_text[:12000]}"}],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    raw_text = response.content[0].text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not extract profile data from that page.")

    if "profile" in parsed and isinstance(parsed["profile"], dict):
        return {"profile": parsed["profile"], "warnings": parsed.get("warnings", [])}
    return {"profile": parsed, "warnings": []}
