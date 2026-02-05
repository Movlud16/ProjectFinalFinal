from __future__ import annotations

import asyncio
import json
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, List, Optional

from playwright.async_api import async_playwright, ConsoleMessage, Page

@dataclass
class ConsoleEntry:
    ts: str
    type: str
    text: str
    location: Optional[dict] = None
    args: Optional[List[str]] = None

@dataclass
class PageErrorEntry:
    ts: str
    message: str
    name: Optional[str] = None
    stack: Optional[str] = None

async def capture(url: str, timeout_ms: int = 15000) -> dict[str, Any]:
    console_entries: list[ConsoleEntry] = []
    page_errors: list[PageErrorEntry] = []
    request_failures: list[dict[str, Any]] = []
    bad_responses: list[dict[str, Any]] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page: Page = await context.new_page()

        def on_console(msg: ConsoleMessage) -> None:
            loc = msg.location
            console_entries.append(
                ConsoleEntry(
                    ts=datetime.utcnow().isoformat() + "Z",
                    type=msg.type,
                    text=msg.text,
                    location={k: loc.get(k) for k in ("url", "lineNumber", "columnNumber")}
                    if loc
                    else None,
                )
            )

        def on_page_error(exc: Exception) -> None:
            page_errors.append(
                PageErrorEntry(
                    ts=datetime.utcnow().isoformat() + "Z",
                    message=str(exc),
                    name=getattr(exc, "name", None),
                    stack=getattr(exc, "stack", None),
                )
            )

        def on_request_failed(request) -> None:  # playwright type is dynamic
            failure = request.failure
            request_failures.append(
                {
                    "ts": datetime.utcnow().isoformat() + "Z",
                    "url": request.url,
                    "method": request.method,
                    "resourceType": request.resource_type,
                    "failure": failure if failure else None,
                }
            )

        page.on("console", on_console)
        page.on("pageerror", on_page_error)
        page.on("requestfailed", on_request_failed)

        def on_response(response) -> None:  # playwright type is dynamic
            try:
                status = response.status
                if status < 400:
                    return
                url_ = response.url
                if not (url_.startswith("http://") or url_.startswith("https://")):
                    return
                req = response.request
                bad_responses.append(
                    {
                        "ts": datetime.utcnow().isoformat() + "Z",
                        "url": url_,
                        "status": status,
                        "statusText": response.status_text,
                        "method": getattr(req, "method", None),
                        "resourceType": getattr(req, "resource_type", None),
                    }
                )
            except Exception:
                return

        page.on("response", on_response)

        try:
            await page.goto(url, wait_until="load", timeout=timeout_ms)
        except Exception as exc:
            page_errors.append(
                PageErrorEntry(
                    ts=datetime.utcnow().isoformat() + "Z",
                    message=f"Navigation failed: {exc}",
                )
            )
        # Give late scripts time to log.
        await page.wait_for_timeout(1500)

        await context.close()
        await browser.close()

    return {
        "url": url,
        "console": [asdict(e) for e in console_entries],
        "pageErrors": [asdict(e) for e in page_errors],
        "requestFailed": request_failures,
        "badResponses": bad_responses,
    }

def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5173/index.html"
    out = asyncio.run(capture(url))
    print(json.dumps(out, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
