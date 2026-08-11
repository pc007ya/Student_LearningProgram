#!/usr/bin/env python3
"""Create compact face-plus-hair previews from the female head modules.

The 512x800 head modules are used by the avatar renderer and intentionally
retain their canvas coordinates.  Shop cards need the visible head only, so
this script crops their alpha bounds into independent, body-free previews.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "rewards/wardrobe/modular-v3/modules"
OUTPUT = ROOT / "rewards/items"
NAMES = (
    "base",
    "bob",
    "ponytail",
    "wavy-lob",
    "twin-braids",
    "atelier-v4",
    "creative-v4",
    "performance-v4",
)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        source = SOURCE / f"female-head-{name}.png"
        target = OUTPUT / f"hair-face-{name}.png"
        image = Image.open(source).convert("RGBA")
        bbox = image.getbbox()
        if not bbox:
            raise SystemExit(f"no visible head pixels in {source}")
        cropped = image.crop(bbox)
        px = cropped.load()
        for y in range(cropped.height):
            for x in range(cropped.width):
                r, g, b, a = px[x, y]
                if a and g > 105 and g > r * 1.10 and g > b * 1.08:
                    px[x, y] = (r, g, b, 0)
        cropped.save(target)
        print(target)


if __name__ == "__main__":
    main()
