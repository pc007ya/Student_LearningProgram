#!/usr/bin/env python3
"""Split a three-column green-screen female outfit sheet into wardrobe assets.

The generated packages use the same contract as female-layered-v1:
1000×1900 transparent canvas layers for the avatar and cropped, body-free
shop images for product cards.
"""

from pathlib import Path
import argparse
import json

from PIL import Image


SETS = [
    ("sheet-atelier", "Atelier 黑色西裝", (40, 380), 970),
    ("sheet-creative", "Creative 灰黑短版外套", (430, 820), 975),
    ("sheet-performance", "Performance 黑色不對稱上衣", (850, 1210), None),
]
ROWS = {"hair": (0, 190), "top": (175, 535), "bot": (515, 1060), "shoe": (1040, 1215)}
CANVAS_BOXES = {
    # These boxes are the female_Base.png anchor coordinates, not the
    # source-sheet crop bounds.  They keep the three imported sets on the
    # same female skeleton while allowing each garment's transparent crop to
    # retain its native silhouette.
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
            if g > 90 and g > r * 1.45 and g > b * 1.35:
                px[x, y] = (r, g, b, 0)
            elif g > 80 and g > r * 1.15 and g > b * 1.12:
                # Remove the remaining green-screen halo instead of keeping
                # a translucent green fringe around black/white garments.
                px[x, y] = (r, g, b, 0)
    return image


def trim(image: Image.Image) -> Image.Image:
    box = image.getbbox()
    return image.crop(box) if box else image


def strip_skin(image: Image.Image, part: str) -> Image.Image:
    """Remove exposed body pixels from shop artwork only.

    The source sheet contains the garments over a model.  A colour key alone
    cannot distinguish pale skin from the white Atelier blouse, so combine a
    conservative skin chroma test with fixed cut-outs for the known source
    layout.  Canvas layers intentionally keep the connections to the body;
    only the shop previews use this cleanup.
    """
    image = image.copy().convert("RGBA")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            # Strongly chromatic skin (hands, legs and face).  The ratio
            # avoids deleting neutral white/grey clothing.
            if a and ((part != "top" and r > 70 and r > g * 1.08 and g > b * 1.04 and (r - b) > 18)
                      or (part == "top" and r > 100 and r > g * 1.10 and g > b * 1.05 and (r - b) > 24)):
                px[x, y] = (r, g, b, 0)
            if part == "hair" and a and max(r, g, b) > 150:
                # The hair row includes the model's bright face. Hair is
                # intentionally kept to its dark silhouette for a clean card.
                px[x, y] = (r, g, b, 0)

            # Fixed transparent cut-outs remove the remaining neutral skin
            # areas that are visible in the three supplied sheet columns.
            nx = x / max(1, image.width)
            ny = y / max(1, image.height)
            cut = False
            if part == "top":
                cut = (
                    # hands/forearms outside the sleeves
                    ((nx < .16 or nx > .84) and ny > .52)
                    # neck/face showing through the collar
                    or (.30 < nx < .70 and ny < .30)
                    # exposed waist below the cropped top
                    or (.25 < nx < .75 and ny > .82)
                )
            elif part == "hair":
                # Hair cards must not include the model's face or shoulders.
                # Keep the cap and side locks, remove the central face from
                # the first fifth of the crop downward.
                cut = ny > .30
            elif part == "shoe":
                # Keep the shoes, remove bare ankles/toes below them.
                cut = (ny > .84 and (nx < .38 or nx > .62))
            elif part == "bot":
                # Bottom crops include the model's bare feet below the
                # trouser hem; shoes are supplied by the independent shoe
                # layer, so leave that region transparent.
                cut = ny > .88
            if cut and a:
                px[x, y] = (r, g, b, 0)
    return image


def place(canvas: Image.Image, image: Image.Image, box) -> None:
    x0, y0, x1, y1 = box
    canvas.alpha_composite(image.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS), (x0, y0))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    source = key_green(Image.open(args.source))
    args.output.mkdir(parents=True, exist_ok=True)

    for folder, title, (x0, x1), bottom_cutoff in SETS:
        root = args.output / folder
        root.mkdir(parents=True, exist_ok=True)
        base_path = args.output / "sports-bra-cargo-shorts" / "base.png"
        if base_path.exists():
            Image.open(base_path).convert("RGBA").save(root / "base.png")
        canvas_layers = {}
        for part, (y0, y1) in ROWS.items():
            crop = source.crop((x0, y0, x1, y1))
            if part == "bot" and bottom_cutoff is not None:
                crop = source.crop((x0, y0, x1, bottom_cutoff))
            crop = trim(crop)
            clean = trim(strip_skin(crop, part))
            shop = clean.copy()
            shop.save(root / ("shop-bottom.png" if part == "bot" else f"shop-{part}.png"))
            layer = Image.new("RGBA", (1000, 1900), (0, 0, 0, 0))
            # Canvas layers are body-free as well: the female base supplies
            # the head, arms, legs and face beneath these clothing assets.
            place(layer, clean, CANVAS_BOXES[part])
            layer.save(root / f"{part}.png")
            canvas_layers[part] = layer

        dressed = Image.new("RGBA", (1000, 1900), (0, 0, 0, 0))
        for part in ("hair", "bot", "top", "shoe"):
            dressed.alpha_composite(canvas_layers[part])
        dressed.save(root / "set.png")
        (root / "manifest.json").write_text(json.dumps({
            "id": folder,
            "title": title,
            "audience": "girl",
            "canvas": {"width": 1000, "height": 1900},
            "base": "base.png",
            "parts": {part: {"canvas": f"{part}.png", "shop": ("shop-bottom.png" if part == "bot" else f"shop-{part}.png")} for part in ("hair", "top", "bot", "shoe")},
            "set": "set.png",
            "renderOrder": ["base", "bot", "top", "shoe", "hand", "hair", "hat"],
        }, ensure_ascii=False, indent=2) + "\n")
        print(root)


if __name__ == "__main__":
    main()
