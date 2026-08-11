#!/usr/bin/env python3
"""Import a green-screen sheet of complete female outfits as ``set`` items.

The supplied sheet is deliberately kept as one-piece products: each package
contains one 1000x1900 canvas layer and one body-free shop preview.  The
canvas layer carries the matching hair, garment and shoes so a set can be
equipped atomically without exposing the source model's body on the shop
card.
"""

from pathlib import Path
import argparse
import json

from PIL import Image


SETS = [
    ("set-navy-pleated", "海軍藍百褶洋裝套裝", (85, 425)),
    ("set-ivory-academy", "象牙針織學院套裝", (585, 925)),
    ("set-denim-pinafore", "丹寧吊帶裙休閒套裝", (1080, 1435)),
]
# Source coordinates for the 1536x1024 reference sheet.
ROWS = {"hair": (0, 190), "top": (175, 390), "bot": (330, 560), "shoe": (870, 1020)}
CANVAS_BOXES = {
    "hair": (380, 50, 620, 320),
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
            if g > 85 and g > r * 1.28 and g > b * 1.20:
                px[x, y] = (r, g, b, 0)
    return image


def trim(image: Image.Image) -> Image.Image:
    box = image.getbbox()
    return image.crop(box) if box else image


def skin(r: int, g: int, b: int) -> bool:
    # Conservative chroma test: neutral white/cream fabrics remain intact.
    return r > 86 and r > g * 1.09 and g > b * 1.035 and r - b > 17


def clean(image: Image.Image, part: str) -> Image.Image:
    image = image.copy().convert("RGBA")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            nx = x / max(1, image.width)
            ny = y / max(1, image.height)
            remove = False
            if part == "hair":
                # Keep the dark hair/bun; remove the face, neck and shoulders
                # that are present in the reference head crops.
                remove = max(r, g, b) > 155 or (0.28 < nx < 0.72 and ny > 0.22)
            elif part == "top":
                # Keep the garment/sleeves but cut the model's forearms and
                # hands outside the clothing silhouette.  The three source
                # columns use the same shoulder width, so this conservative
                # boundary works for the sleeveless, cardigan and T-shirt
                # variants without clipping their cuffs.
                remove = skin(r, g, b) or nx < .18 or nx > .82 or ny > .90
            elif part == "bot":
                remove = skin(r, g, b) or ny > .84
            elif part == "shoe":
                remove = skin(r, g, b) or ny < .10
            if remove:
                px[x, y] = (r, g, b, 0)
    return trim(image)


def place(canvas: Image.Image, image: Image.Image, box) -> None:
    x0, y0, x1, y1 = box
    canvas.alpha_composite(image.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS), (x0, y0))


def remove_green_fringe(image: Image.Image) -> Image.Image:
    image = image.copy().convert("RGBA")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            if a and g > 105 and g > r * 1.10 and g > b * 1.08:
                px[x, y] = (r, g, b, 0)
    return image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    source = key_green(Image.open(args.source))
    base_path = args.output / "sports-bra-cargo-shorts" / "base.png"
    if not base_path.exists():
        raise SystemExit(f"missing female base: {base_path}")

    for folder, title, (x0, x1) in SETS:
        root = args.output / folder
        root.mkdir(parents=True, exist_ok=True)
        Image.open(base_path).convert("RGBA").save(root / "base.png")
        layers = {}
        for part, (y0, y1) in ROWS.items():
            asset = clean(source.crop((x0, y0, x1, y1)), part)
            layer = Image.new("RGBA", (1000, 1900), (0, 0, 0, 0))
            place(layer, asset, CANVAS_BOXES[part])
            layers[part] = layer

        dressed = Image.new("RGBA", (1000, 1900), (0, 0, 0, 0))
        for part in ("bot", "top", "shoe", "hair"):
            dressed.alpha_composite(layers[part])
        dressed.save(root / "set.png")
        preview = remove_green_fringe(trim(dressed))
        preview.save(root / "shop-set.png")
        (root / "manifest.json").write_text(json.dumps({
            "id": folder,
            "title": title,
            "audience": "girl",
            "canvas": {"width": 1000, "height": 1900},
            "base": "base.png",
            "parts": {"set": {"canvas": "set.png", "shop": "shop-set.png"}},
            "set": "set.png",
            "renderOrder": ["base", "set"],
            "source": "green-screen three-column outfit sheet",
        }, ensure_ascii=False, indent=2) + "\n")
        print(root)


if __name__ == "__main__":
    main()
