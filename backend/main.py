import json
import os
import threading
from pathlib import Path
from queue import Empty, Queue
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent import run_agent
from student_profile import StudentProfile

# Walk up from backend/ to find the .env (works locally and on Render)
for _candidate in [Path(__file__).parent / ".env", Path(__file__).parent.parent.parent / ".env"]:
    if _candidate.exists():
        load_dotenv(_candidate, override=True)
        break

app = FastAPI(title="ScholarMatch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
