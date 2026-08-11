#!/usr/bin/env python3
"""Validate a full-canvas female outfit before it is used by the CSS rig."""

import json
import sys
from pathlib import Path

from PIL import Image


WARDROBE_ROOT = Path(__file__).resolve().parents[1] / "rewards/wardrobe/female-layered-v1"
ROOT = WARDROBE_ROOT / "sports-bra-cargo-shorts"


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    raise SystemExit(1)


def validate_transparent_padding(path: Path, minimum: int = 24) -> None:
    image = Image.open(path).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        fail(f"empty preview: {path}")
    left, top, right, bottom = bbox
    margins = (left, top, image.width - right, image.height - bottom)
    if min(margins) < minimum:
        fail(f"preview {path} needs {minimum}px transparent padding, got {margins}")


def validate_sports(root: Path) -> None:
    coordinates = json.loads((root / "coordinates.json").read_text())
    canvas = tuple(coordinates["canvas_size"])
    for name in ("base", "top", "bottom"):
        path = root / f"{name}.png"
        if not path.exists():
            fail(f"missing {path}")
        image = Image.open(path).convert("RGBA")
        if image.size != canvas:
            fail(f"{name} is {image.size}, expected {canvas}")
        expected = coordinates.get(name, {}).get("bbox")
        if expected and image.getbbox() != tuple(expected):
            fail(f"{name} alpha bbox {image.getbbox()} != {tuple(expected)}")

    # A composited preview is intentionally generated in memory only. The
    # browser performs the same order with CSS: base → bottom → top.
    composite = Image.open(root / "base.png").convert("RGBA")
    composite.alpha_composite(Image.open(root / "bottom.png").convert("RGBA"))
    composite.alpha_composite(Image.open(root / "top.png").convert("RGBA"))
    # The base establishes the final character bounds; set.png is a clothing
    # reference and therefore has a deliberately smaller bbox.
    base_bbox = Image.open(root / "base.png").convert("RGBA").getbbox()
    if composite.getbbox() != base_bbox:
        fail(f"composite alpha bbox {composite.getbbox()} does not match base bbox {base_bbox}")
    print(f"OK: {root.name} canvas={canvas} order=base→bottom→top")


def validate_sheet(root: Path) -> None:
    manifest = json.loads((root / "manifest.json").read_text())
    canvas = (manifest["canvas"]["width"], manifest["canvas"]["height"])
    canvas_parts = tuple(manifest.get("parts", {}).keys())
    for part in ("base", *canvas_parts, "set"):
        path = root / f"{part}.png"
        if not path.exists():
            fail(f"missing {path}")
        image = Image.open(path).convert("RGBA")
        if image.size != canvas:
            fail(f"{path.name} is {image.size}, expected {canvas}")
    for part, info in manifest.get("parts", {}).items():
        path = root / info["shop"]
        if not path.exists():
            fail(f"missing {path}")
        image = Image.open(path).convert("RGBA")
        for r, g, b, a in image.getdata():
            if a > 10 and g > 120 and g > r * 1.15 and g > b * 1.12:
                fail(f"green-screen fringe remains in {path}")
    # CSS-anchored previews (currently shoes) are still shop assets and must
    # be present and transparent. This catches tightly cropped or stale
    # green-screen previews before they reach the reward cards.
    for part, filename in manifest.get("cssAnchors", {}).items():
        path = root / filename
        if not path.exists():
            fail(f"missing CSS-anchor preview for {part}: {path}")
        image = Image.open(path).convert("RGBA")
        validate_transparent_padding(path)
        for r, g, b, a in image.getdata():
            if a > 10 and g > 120 and g > r * 1.15 and g > b * 1.12:
                fail(f"green-screen fringe remains in {path}")
    print(f"OK: {root.name} canvas={canvas} parts={'/'.join(canvas_parts)} shop previews=body-free")


def main() -> None:
    validate_sports(ROOT)
    # Every generated package except the legacy sports root carries a
    # manifest, including atomic ``set-*`` complete outfits.
    for root in sorted(WARDROBE_ROOT.iterdir()):
        if root.is_dir() and root != ROOT and (root / "manifest.json").exists():
            validate_sheet(root)


if __name__ == "__main__":
    main()
