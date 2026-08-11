#!/usr/bin/env python3
"""Rebuild shoe shop previews from the verified full-canvas shoe layers.

The source-sheet crops can touch the crop boundary, which makes a product
card look clipped even when the CSS uses object-fit: contain. The authored
1000x1900 layer has the reliable alpha bounds, so derive a compact preview
from that layer and add transparent breathing room around it.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "rewards/wardrobe/female-layered-v1"
PADDING = 32


def remove_green_fringes(image: Image.Image) -> Image.Image:
    image = image.copy().convert("RGBA")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            # The source sheets were keyed against a green screen.  Dark
            # anti-aliased green pixels survive a simple bright-green test,
            # so use a lower chroma threshold before finding the silhouette.
            if a and g > 35 and g > r * 1.10 and g > b * 1.05:
                px[x, y] = (r, g, b, 0)
    return image


def keep_shoe_components(image: Image.Image) -> Image.Image:
    """Keep the two shoe silhouettes and discard keyed fringe islands.

    Several generated sheets contain a thin, detached horizontal artifact
    above the shoes.  It expands the alpha bounding box and makes the card
    preview appear clipped.  The pair is always represented by the two
    largest connected alpha components, so removing smaller islands is safe
    and deterministic for every shoe package.
    """
    alpha = image.getchannel("A")
    width, height = image.size
    pixels = alpha.load()
    pending = {
        (x, y)
        for y in range(height)
        for x in range(width)
        if pixels[x, y] > 20
    }
    components = []
    while pending:
        seed = pending.pop()
        stack = [seed]
        component = [seed]
        while stack:
            x, y = stack.pop()
            for nx, ny in (
                (x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                (x - 1, y - 1), (x - 1, y + 1),
                (x + 1, y - 1), (x + 1, y + 1),
            ):
                point = (nx, ny)
                if point in pending:
                    pending.remove(point)
                    stack.append(point)
                    component.append(point)
        components.append(component)
    keep = set()
    for component in sorted(components, key=len, reverse=True)[:2]:
        keep.update(component)
    cleaned = image.copy()
    out = cleaned.load()
    for y in range(height):
        for x in range(width):
            if (x, y) not in keep:
                r, g, b, _ = out[x, y]
                out[x, y] = (r, g, b, 0)
    return cleaned


def main() -> None:
    rebuilt = 0
    for folder in sorted(ROOT.glob("sheet-*")):
        canvas_path = folder / "shoe.png"
        if not canvas_path.exists():
            continue
        image = keep_shoe_components(remove_green_fringes(Image.open(canvas_path)))
        alpha = image.getchannel("A")
        bbox = alpha.getbbox()
        if not bbox:
            raise SystemExit(f"empty shoe layer: {canvas_path}")
        crop = image.crop(bbox)
        preview = Image.new(
            "RGBA",
            (crop.width + PADDING * 2, crop.height + PADDING * 2),
            (0, 0, 0, 0),
        )
        preview.alpha_composite(crop, (PADDING, PADDING))
        preview.save(folder / "shop-shoe.png")
        rebuilt += 1
        print(f"OK: {folder.name}/shop-shoe.png {preview.size} from bbox={bbox}")
    print(f"Rebuilt {rebuilt} shoe shop previews")


if __name__ == "__main__":
    main()
