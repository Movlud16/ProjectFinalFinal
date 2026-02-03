#!/usr/bin/env python3
"""Generate images/world-map.svg from public-domain Natural Earth land polygons.

This is a small build-time helper (not used at runtime).
"""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

DATA_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson"

W, H = 1200, 600


def proj(lon: float, lat: float) -> tuple[float, float]:
    # Equirectangular projection
    x = (lon + 180.0) / 360.0 * W
    y = (90.0 - lat) / 180.0 * H
    return round(x, 1), round(y, 1)


def ring_to_path(coords: list[list[float]]) -> str:
    if not coords:
        return ""
    pts = [proj(lon, lat) for lon, lat in coords]
    d = [f"M{pts[0][0]},{pts[0][1]}"]
    for x, y in pts[1:]:
        d.append(f"L{x},{y}")
    d.append("Z")
    return " ".join(d)


def geom_to_paths(geom: dict) -> list[str]:
    geom_type = geom.get("type")
    coords = geom.get("coordinates")
    paths: list[str] = []

    if geom_type == "Polygon":
        for ring in coords:
            paths.append(ring_to_path(ring))
    elif geom_type == "MultiPolygon":
        for poly in coords:
            for ring in poly:
                paths.append(ring_to_path(ring))

    return [p for p in paths if p]


def main() -> None:
    with urllib.request.urlopen(DATA_URL) as resp:
        geo = json.loads(resp.read().decode("utf-8"))

    all_paths: list[str] = []
    for feat in geo.get("features", []):
        geom = feat.get("geometry")
        if geom:
            all_paths.extend(geom_to_paths(geom))

    d = " ".join(all_paths)

    # Graticule lines every 30°
    vert = []
    for lon in range(-180, 181, 30):
        x = round((lon + 180) / 360 * W, 1)
        vert.append(f'<line class="grid" x1="{x}" y1="0" x2="{x}" y2="{H}"/>')

    horiz = []
    for lat in range(-60, 61, 30):
        y = round((90 - lat) / 180 * H, 1)
        horiz.append(f'<line class="grid" x1="0" y1="{y}" x2="{W}" y2="{y}"/>')

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="World map">\n'
        '  <defs>\n'
        '    <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">\n'
        '      <stop offset="0" stop-color="#0a1220"/>\n'
        '      <stop offset="1" stop-color="#070d16"/>\n'
        '    </linearGradient>\n'
        '    <radialGradient id="glow" cx="30%" cy="25%" r="70%">\n'
        '      <stop offset="0" stop-color="#5aa6ff" stop-opacity="0.14"/>\n'
        '      <stop offset="1" stop-color="#000000" stop-opacity="0"/>\n'
        '    </radialGradient>\n'
        '    <style>\n'
        '      .ocean { fill: url(#ocean); }\n'
        '      .glow { fill: url(#glow); }\n'
        '      .land { fill: rgba(255,255,255,0.22); stroke: rgba(255,255,255,0.18); stroke-width: 1; }\n'
        '      .grid { stroke: rgba(255,255,255,0.07); stroke-width: 1; }\n'
        '    </style>\n'
        '  </defs>\n\n'
        f'  <rect class="ocean" width="{W}" height="{H}"/>\n'
        f'  <rect class="glow" width="{W}" height="{H}"/>\n\n'
        f'  <g opacity="0.55">{"".join(vert)}{"".join(horiz)}</g>\n'
        f'  <path class="land" fill-rule="evenodd" d="{d}"/>\n'
        '</svg>\n'
    )

    out = Path(__file__).resolve().parents[1] / "images" / "world-map.svg"
    out.write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    main()
