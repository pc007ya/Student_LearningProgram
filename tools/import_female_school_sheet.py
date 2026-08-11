#!/usr/bin/env python3
"""Import the three-column school-uniform sheet as female layered assets."""

from pathlib import Path
import argparse
import json

from PIL import Image


SETS = [
    ("sheet-campus-sailor", "Campus Sailor 水手校園", (20, 350)),
    ("sheet-academy-noir", "Academy Noir 黑色學院", (360, 730)),
    ("sheet-modern-academy", "Modern Academy 現代學院", (730, 1065)),
]
ROWS = {"hat": (0, 220), "top": (220, 650), "bot": (650, 1235), "shoe": (1235, 1448)}
CANVAS_BOXES = {
    "hat": (390, 25, 610, 260),
    "top": (250, 285, 750, 790),
    "bot": (250, 675, 750, 1420),
    "shoe": (420, 1480, 580, 1630),
}


def key_green(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            if g > 80 and g > r * 1.15 and g > b * 1.12:
                px[x, y] = (r, g, b, 0)
    return image


def trim(image: Image.Image) -> Image.Image:
    box = image.getbbox()
    return image.crop(box) if box else image


def clean(image: Image.Image, part: str) -> Image.Image:
    image = image.copy().convert("RGBA")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            nx = x / max(1, image.width)
            ny = y / max(1, image.height)
            cut = False
            # Neutral skin is deliberately removed by geometry so the white
            # sailor shirt remains intact.
            if part == "top":
                cut = ((nx < .16 or nx > .84) and ny > .50) or (.30 < nx < .70 and ny < .28)
            elif part == "bot":
                cut = ny > .84
            elif part == "shoe":
                cut = ny > .84 and (nx < .38 or nx > .62)
            if a and cut:
                px[x, y] = (r, g, b, 0)
            elif a and ((part != "top" and r > 70 and r > g * 1.08 and g > b * 1.04 and r - b > 18)
                        or (part == "top" and r > 100 and r > g * 1.10 and g > b * 1.05 and r - b > 24)):
                px[x, y] = (r, g, b, 0)
    return trim(image)


def place(canvas: Image.Image, image: Image.Image, box) -> None:
    x0, y0, x1, y1 = box
    canvas.alpha_composite(image.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS), (x0, y0))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    source = key_green(Image.open(args.source))
    base = args.output / "sports-bra-cargo-shorts" / "base.png"
    if not base.exists():
        raise SystemExit(f"missing female base: {base}")
    for folder, title, (x0, x1) in SETS:
        root = args.output / folder
        root.mkdir(parents=True, exist_ok=True)
        Image.open(base).convert("RGBA").save(root / "base.png")
        layers = {}
        for part, (y0, y1) in ROWS.items():
            asset = clean(source.crop((x0, y0, x1, y1)), part)
            shop_name = {"hat": "shop-hat.png", "top": "shop-top.png", "bot": "shop-bottom.png", "shoe": "shop-shoe.png"}[part]
            asset.save(root / shop_name)
            layer = Image.new("RGBA", (1000, 1900), (0, 0, 0, 0))
            place(layer, asset, CANVAS_BOXES[part])
            layer.save(root / f"{part}.png")
            layers[part] = layer
        dressed = Image.new("RGBA", (1000, 1900), (0, 0, 0, 0))
        for part in ("bot", "top", "shoe", "hat"):
            dressed.alpha_composite(layers[part])
        dressed.save(root / "set.png")
        (root / "manifest.json").write_text(json.dumps({
            "id": folder,
            "title": title,
            "audience": "girl",
            "canvas": {"width": 1000, "height": 1900},
            "base": "base.png",
            "parts": {part: {"canvas": f"{part}.png", "shop": {"hat": "shop-hat.png", "top": "shop-top.png", "bot": "shop-bottom.png", "shoe": "shop-shoe.png"}[part]} for part in ("hat", "top", "bot", "shoe")},
            "set": "set.png",
            "renderOrder": ["base", "bot", "top", "shoe", "hand", "hair", "hat"],
        }, ensure_ascii=False, indent=2) + "\n")
        print(root)


if __name__ == "__main__":
    main()
