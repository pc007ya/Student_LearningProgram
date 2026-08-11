#!/usr/bin/env python3
"""Attach the curated 120 generated picture cards to both English banks."""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "images" / "english-generated-v1"

GENERATED_WORDS = {
    1: """apple ant ball banana bear bed bee bird boat book box bread bus cake car cat
    chair chicken clock cloud coat cow cup desk dog doll door duck egg elephant fish flower
    fox frog garden goat grape hat horse house ice juice kite lion moon mouse orange owl
    panda pen pencil pig pizza plane rabbit rain school sheep shoe train""".split(),
    2: """rock card wind ship wood gold leaf pool salt ring meal meat tool shop gift scarf
    knee tape bowl wing lake gate sand lock flag mail bell soup tent rope pond fork drum wolf
    soap coin sofa taxi lamb rose heart phone movie radio hotel truck photo plate shirt ocean
    tooth wheel knife piano jeans skirt zebra camel goose stamp""".split(),
}


def main() -> None:
    total = 0
    for grade, selected in GENERATED_WORDS.items():
        if len(selected) != 60 or len(set(selected)) != 60:
            raise SystemExit(f"grade {grade} generated-art list must contain 60 unique words")
        path = ROOT / "data" / f"english-words-grade{grade}-v2.json"
        payload = json.loads(path.read_text(encoding="utf-8"))
        by_word = {entry["word"]: entry for entry in payload["words"]}
        missing_words = sorted(set(selected) - set(by_word))
        missing_art = sorted(word for word in selected if not (ART_DIR / f"{word}.webp").exists())
        if missing_words or missing_art:
            raise SystemExit(f"grade {grade}: missing words={missing_words}, missing art={missing_art}")
        selected_set = set(selected)
        for entry in payload["words"]:
            word = entry["word"]
            if word in selected_set:
                entry["image"] = f"images/english-generated-v1/{word}.webp"
            elif entry["image"].startswith("images/english-generated-v1/"):
                entry["image"] = f"images/english-cards/words-v2/{word}.svg"
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        total += len(selected)
        print(f"grade {grade}: {len(selected)} generated picture cards")
    print(f"total: {total}")


if __name__ == "__main__":
    main()
