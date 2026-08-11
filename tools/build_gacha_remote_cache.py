#!/usr/bin/env python3
"""Download the published collection sheets into an offline-safe JSON cache.

The site still refreshes from Google Sheets at runtime, but this cache means a
file preview or a blocked CORS request does not fall back to only the 18 demo
cards committed in the first version of the project.
"""
from __future__ import annotations

import json
import re
import subprocess
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEET_ID = "17gH9HZKvW_6fMCWYLyqnzMHj40rA7PiwWg6L0GvbFgQ"
SHEETS = [("吉伊", "chiikawa"), ("小八", "hachiware"), ("兔兔", "usagi"), ("小桃", "momonga"), ("師傅", "rakko"), ("栗子", "kurimanju"), ("獅薩", "shisa"), ("古本", "furuhon"), ("其他角色", "other")]


def fetch(sheet: str) -> dict:
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={urllib.parse.quote(sheet)}"
    raw = subprocess.check_output(["curl", "-L", "--fail", "--silent", "--show-error", url], text=True)
    match = re.search(r"\{.*\}", raw, re.S)
    if not match:
        raise RuntimeError(f"No JSON returned for {sheet}")
    return json.loads(match.group(0))


def main() -> None:
    items = []
    for character, slug in SHEETS:
        table = fetch(character)["table"]
        for index, row in enumerate(table.get("rows", [])[1:], 1):
            cells = row.get("c", [])

            def value(column: int) -> str:
                cell = cells[column] if column < len(cells) else None
                return str(cell.get("v", "")).strip() if cell and cell.get("v") is not None else ""

            asset = value(3)
            if not asset:
                continue
            code = value(2) or f"{index:04d}"
            items.append({
                "id": f"{slug}-{code}", "character": character,
                "name": value(1) or "未命名", "type": value(0) or "其他",
                "rarity": "普通", "weight": 1, "asset": asset,
                "sourceUrl": value(4),
            })
    output = ROOT / "gacha-remote-cache.json"
    output.write_text(json.dumps({"schemaVersion": 1, "source": "Google Sheets cache", "items": items}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {len(items)} items to {output}")


if __name__ == "__main__":
    main()
