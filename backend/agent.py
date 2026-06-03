"""
Scholarship agent — streaming version.
run_agent() emits events to a Queue consumed by the FastAPI SSE endpoint.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from queue import Queue

import anthropic

from nimble_client import nimble_extract, nimble_search
from student_profile import StudentProfile

MODEL = "claude-sonnet-4-6"
TODAY = date.today().strftime("%B %d, %Y")

TOOLS = [
    {
        "name": "nimble_search",
        "description": (
            "Search the web using Nimble's Search API. Use for finding scholarship URLs, "
            "running popularity checks against aggregator sites, and finding past winner pages."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Search query"}},
            "required": ["query"],
        },
    },
    {
        "name": "nimble_extract",
        "description": (
            "Extract full page content from a URL using Nimble's Extract API. "
            "REQUIRED before including any scholarship in the final output. "
            "Use on scholarship pages, foundation sites, past-winner pages, and "
            "employer scholarship portals. Handles JS-rendered and bot-protected pages."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string", "description": "Full URL to extract"}},
            "required": ["url"],
        },
    },
]


def build_system_prompt() -> str:
    return f"""You are a niche scholarship research agent. Today's date is {TODAY}.

Your job is to find scholarships that a specific student is UNIQUELY qualified for —
ones with small applicant pools that mainstream sites don't index.

CRITICAL RULE: Do NOT include any scholarship in the final output unless you have
called nimble_extract on its page. Search finds candidates. Extract verifies them.
Every result must be extract-confirmed.

═══════════════════════════════════════════════════════════
PHASE 1 — EXHAUSTIVE SEARCH (60+ queries)
═══════════════════════════════════════════════════════════
Run every applicable category below using the student's actual values.

UNIVERSITY-SPECIFIC (run first — highest hit rate):
  "[university name] scholarship undergraduate"
  "[university name] foundation scholarship [major]"
  "[university name] alumni scholarship [major]"
  "[university name] [year] scholarship award"
  "[university name] department [major] scholarship"
  "[university name] [major] departmental award"
  "[university name] [heritage] scholarship"
  "[university name] first generation scholarship"

LOCATION — work from narrowest to broadest:
  "[city] [county] community foundation scholarship"
  "[county] community foundation scholarship undergraduate"
  "[city] community trust scholarship"
  "[city] rotary club scholarship undergraduate"
  "[city] kiwanis scholarship"
  "[city] lions club scholarship"
  "[city] chamber of commerce scholarship"
  "[city] [heritage] scholarship"
  "[state] [major] scholarship undergraduate"
  "[state] community foundation scholarship [major]"
  "[high school name] alumni scholarship"
  "[high school district] scholarship"

HERITAGE / IDENTITY / LANGUAGE:
  "[ethnicity] scholarship undergraduate"
  "[ethnicity] [state] scholarship"
  "[ethnicity] [major] scholarship"
  "[ethnicity] professional association scholarship"
  "[ethnicity] foundation scholarship undergraduate"
  "[country of origin] American foundation scholarship"
  "[religion] scholarship undergraduate [state]"
  "[religion] [denomination] scholarship undergraduate"
  "[language] bilingual scholarship undergraduate"
  "[language] heritage scholarship [state]"
  first generation college student scholarship [state]  (if applicable)
  military dependent undergraduate scholarship [state]  (if applicable)
  DACA scholarship undergraduate [state]  (if applicable)

NATIONAL CLUB ORGANIZATIONS (one query per org — most underused category):
  "[org name] scholarship"
  "[org name] foundation scholarship undergraduate"
  "[org name] educational foundation award"

ACTIVITIES (one query per activity):
  "[activity] scholarship undergraduate"
  "[activity] national association scholarship"
  "[activity] [state] organization scholarship"

PROFESSIONAL ASSOCIATIONS BY MAJOR:
  "[major field] professional association scholarship undergraduate"
  "[major field] society scholarship"
  "[major field] foundation undergraduate award [state]"
  "[intended profession] association scholarship undergraduate"

EMPLOYER / INDUSTRY / UNION:
  "[parent employer] employee dependent scholarship"
  "[parent employer] foundation scholarship"
  "[parent industry] trade association scholarship [state]"
  "[parent industry] union scholarship undergraduate"
  "[parent union] scholarship dependent"
  "[parent union] education fund scholarship"

FINANCIAL INSTITUTIONS (massively underused):
  "[hometown] credit union scholarship"
  "[state] credit union scholarship undergraduate"

LOCAL INSTITUTIONS:
  "[city] hospital foundation scholarship"
  "[city] utility company scholarship"
  "[city] newspaper scholarship"
  "[state] governor scholarship undergraduate"
  "[state] legislature scholarship"

HIGH-VALUE COMBINATIONS (rarest applicant pools):
  "[heritage] [major] scholarship [state]"
  "[religion] [major] scholarship"
  "[activity] [heritage] scholarship"
  "[national org] [heritage] scholarship"
  "[university] [religion] scholarship"
  "[county] [heritage] scholarship"
  "[language] [major] scholarship"

═══════════════════════════════════════════════════════════
PHASE 2 — EXTRACT EVERY CANDIDATE (mandatory)
═══════════════════════════════════════════════════════════
For every promising URL from Phase 1, call nimble_extract to read the actual page.
You are looking for:
  - Exact dollar amount (is it still active?)
  - Current application deadline — compare to today ({TODAY})
    → Flag as OPEN, CLOSED, or UPCOMING based on today's date
  - Number of awards per year (2 awards = far fewer applicants than 20)
  - Past winners listed (what do they look like? gauge competition)
  - Is it renewable annually or one-time?
  - Application requirements (form only vs. essays vs. recommendations)
  - Contact name and email (critical for small local awards)
  - Citizenship requirement (us_citizen only, or permanent residents OK?)
  - GPA minimum (compare to student's actual GPA)
  - Income threshold (if need-based, compare to student's income bracket)

Also run a popularity check via search before extracting:
  "[scholarship name] site:fastweb.com OR site:chegg.com OR site:cappex.com OR site:scholarships.com"
  → Found on aggregators = high competition → deprioritize
  → NOT found = low competition → prioritize

═══════════════════════════════════════════════════════════
PHASE 3 — PAST WINNERS RESEARCH
═══════════════════════════════════════════════════════════
For your top 5 candidates, search for past winners:
  "[scholarship name] winner [year]"
  "[scholarship name] recipient"
  "[scholarship name] past recipients"

This tells you: how competitive is it really? What do winners look like?
Extract the winners page if one exists.

═══════════════════════════════════════════════════════════
SCORING — Ease of Win (1–10)
═══════════════════════════════════════════════════════════
+3  Not on Fastweb/Chegg/Cappex/Scholarships.com
+2  Geographically narrow (city or county level)
+2  Rare eligibility combination (heritage + major + location, or org membership + heritage)
+1  Small org (local club, single employer, credit union, small foundation)
+1  Few awards per year (≤5 given annually)
+1  Simple application (short form, no essay, or email-only)
+1  Renewable (worth more over time)
+1  Affiliation-gated (requires org membership, union card, or employer connection)
-2  Appears on mainstream aggregator
-1  National eligibility (open to all US students)
-1  GPA requirement above student's actual GPA
-1  Citizenship requirement student does not meet

SKIP any scholarship where:
  - Deadline has already passed AND no evidence it recurs
  - Student is listed in "ALREADY APPLIED"
  - Student clearly does not meet eligibility requirements

═══════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════
First show:
ALREADY APPLIED (excluded): [list if any, else "None"]

Then rank top-10 by ease of win:

#[rank]. [Scholarship Name] — [Organization]
   Amount:      $[amount] | [one-time or renewable]
   Status:      [OPEN — deadline DATE] or [CLOSED — reopens ~MONTH] or [UPCOMING]
   Eligibility: [key requirements — confirmed from extracted page]
   Awards/yr:   [number] — [what this means for competition]
   Apply:       [URL] | [contact name + email if found]
   Effort:      [e.g. "short form, no essay" or "2 essays + 1 rec letter"]
   Past winners:[brief note if found, e.g. "CS students from NYC, avg 3.6 GPA"]
   Match:       [why this student specifically qualifies — cite the profile field that unlocks it]
   Ease of win: [X/10] — [key reason]

⚠️ VERIFY note: flag any detail that could not be confirmed via extract.

After the list:
TOTAL ESTIMATED VALUE: $[sum — use first-year value for renewable awards]
QUICK WINS THIS WEEK: List 2-3 scholarships that are open NOW with simple applications."""


def _handle_tool(name: str, tool_input: dict, nimble_key: str) -> str:
    if name == "nimble_search":
        results = nimble_search(tool_input["query"], nimble_key)
        if not results:
            return "No results found."
        lines = []
        for r in results[:8]:
            lines.append(
                f"Title: {r.get('title', '')}\n"
                f"URL: {r.get('url', '')}\n"
                f"Snippet: {r.get('description', '')[:300]}"
            )
        return "\n\n---\n\n".join(lines)

    if name == "nimble_extract":
        content = nimble_extract(tool_input["url"], nimble_key)
        return content[:8000] if content else "Could not extract content from this URL."

    return "Unknown tool."


def run_agent(profile: StudentProfile, nimble_key: str, anthropic_key: str, event_queue: Queue) -> None:
    client = anthropic.Anthropic(api_key=anthropic_key)
    messages = [
        {
            "role": "user",
            "content": f"Find niche scholarships for this student:\n\n{profile.to_prompt_text()}",
        }
    ]

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=8096,
            system=build_system_prompt(),
            tools=TOOLS,
            messages=messages,
        )

        for block in response.content:
            if hasattr(block, "text") and block.text.strip():
                event_queue.put({"type": "text", "content": block.text})

        if response.stop_reason == "end_turn":
            event_queue.put({"type": "done"})
            break

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_blocks = [b for b in response.content if b.type == "tool_use"]

            def execute_tool(block, _nimble_key=nimble_key, _queue=event_queue):
                if block.name == "nimble_search":
                    _queue.put({"type": "search", "query": block.input["query"]})
                elif block.name == "nimble_extract":
                    _queue.put({"type": "extract", "url": block.input["url"]})
                result = _handle_tool(block.name, block.input, _nimble_key)
                return block.id, result

            with ThreadPoolExecutor(max_workers=8) as executor:
                results_map = dict(
                    f.result() for f in as_completed(
                        executor.submit(execute_tool, b) for b in tool_blocks
                    )
                )

            tool_results = [
                {"type": "tool_result", "tool_use_id": b.id, "content": results_map[b.id]}
                for b in tool_blocks
            ]
            messages.append({"role": "user", "content": tool_results})
            continue

        event_queue.put({"type": "error", "message": f"Unexpected stop: {response.stop_reason}"})
        break
