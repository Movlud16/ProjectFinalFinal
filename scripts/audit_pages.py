from __future__ import annotations

import json
import subprocess

def run_capture(url: str) -> dict:
    out = subprocess.check_output([
        "./.venv/bin/python",
        "scripts/capture_console.py",
        url,
    ], text=True)
    return json.loads(out)

def main() -> int:
    pages = [
        "index.html",
        "systems-solutions.html",
        "news-highlights.html",
        "global-footprint.html",
        "contact.html",
    ]
    base = "http://127.0.0.1:5173/"

    for page in pages:
        url = base + page
        data = run_capture(url)

        console = data.get("console", [])
        page_errors = data.get("pageErrors", [])
        request_failed = data.get("requestFailed", [])
        bad = data.get("badResponses", [])

        print(f"\n=== {page} ===")
        print(
            "counts:",
            f"console={len(console)}",
            f"pageErrors={len(page_errors)}",
            f"requestFailed={len(request_failed)}",
            f"badResponses={len(bad)}",
        )

        for entry in console:
            t = entry.get("type")
            if t in ("error", "warning"):
                text = (entry.get("text") or "").replace("\n", " ")
                print(f"  - console {t}: {text[:220]}")

        for entry in page_errors[:8]:
            msg = (entry.get("message") or "").replace("\n", " ")
            print(f"  - pageerror: {msg[:220]}")

        shown = set()
        for entry in bad:
            u = entry.get("url")
            if not u or u in shown:
                continue
            shown.add(u)
            print(f"  - HTTP {entry.get('status')} {u}")
            if len(shown) >= 10:
                break

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
