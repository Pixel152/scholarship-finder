import re
import requests
from html.parser import HTMLParser

NIMBLE_SEARCH_URL = "https://sdk.nimbleway.com/v1/search"
NIMBLE_EXTRACT_URL = "https://sdk.nimbleway.com/v1/extract"


class _TextExtractor(HTMLParser):
    SKIP_TAGS = {"script", "style", "nav", "footer", "head", "noscript", "iframe"}
    BLOCK_TAGS = {"p", "div", "li", "h1", "h2", "h3", "h4", "br", "tr", "section", "article"}

    def __init__(self):
        super().__init__()
        self._chunks: list = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1
        elif tag in self.BLOCK_TAGS and self._chunks and self._chunks[-1] != "\n":
            self._chunks.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)

    def handle_data(self, data):
        if self._skip_depth:
            return
        text = data.strip()
        if text:
            self._chunks.append(text)

    def get_text(self) -> str:
        joined = " ".join(self._chunks)
        text = re.sub(r"[ \t]+", " ", joined)
        text = re.sub(r"\n{3,}", "\n\n", text)
        lines = [l for l in text.splitlines() if len(l.strip()) > 2]
        return "\n".join(lines).strip()


def _html_to_text(html: str) -> str:
    parser = _TextExtractor()
    try:
        parser.feed(html)
        return parser.get_text()
    except Exception:
        return re.sub(r"<[^>]+>", " ", html).strip()


def nimble_search(query: str, api_key: str, max_results: int = 10) -> list:
    try:
        resp = requests.post(
            NIMBLE_SEARCH_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"query": query, "max_results": max_results, "search_depth": "lite", "focus": "general"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get("results", [])
    except Exception as e:
        print(f"  [Search error] {e}")
        return []


def nimble_extract_linkedin(url: str, api_key: str) -> str:
    """LinkedIn-specific extraction using Nimble's premium rendering with geo + real browser UA."""
    try:
        resp = requests.post(
            NIMBLE_EXTRACT_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "url": url,
                "render": True,
                "driver": "vx8",
                "country": "US",
                "locale": "en-US",
                "headers": {
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    "Accept-Language": "en-US,en;q=0.9",
                },
            },
            timeout=90,
        )
        resp.raise_for_status()
        data = resp.json().get("data", {})
        raw = data.get("markdown") or data.get("text") or data.get("html", "")
        if not raw:
            return ""
        text = _html_to_text(raw) if raw.lstrip().startswith("<") else raw
        # LinkedIn login-wall detection
        if any(phrase in text.lower() for phrase in ["join now", "sign in", "log in to see", "authwall"]):
            return ""
        return text
    except Exception as e:
        print(f"  [LinkedIn extract error] {e}")
        return ""


def nimble_extract(url: str, api_key: str) -> str:
    try:
        resp = requests.post(
            NIMBLE_EXTRACT_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"url": url, "render": True, "driver": "vx8"},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json().get("data", {})
        raw = data.get("markdown") or data.get("text") or data.get("html", "")
        if not raw:
            return "No content extracted."
        return _html_to_text(raw) if raw.lstrip().startswith("<") else raw
    except Exception as e:
        print(f"  [Extract error] {e}")
        return ""
