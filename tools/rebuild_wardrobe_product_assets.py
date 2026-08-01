#!/usr/bin/env python3
"""Rebuild clean shop art and the corrected G05 sailor lower-body module."""

from pathlib import Path
from collections import deque

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MODULES = ROOT / "rewards/wardrobe/modular-v3/modules"
SOURCE = ROOT / "rewards/wardrobe/modular-v3/source"
CANVAS = (512, 800)
PRODUCT_CANVAS = (300, 240)

# Bottom edge of the garment itself on the 512 x 800 rig.  These intentionally
# stop before exposed legs, feet, hands, or shoe-row fragments.
GARMENT_BOTTOM = {
    "g05": 410,
    "g06": 398,
    "g07": 482,
    "g08": 560,
    "g09": 415,
    "g10": 515,
    "g11": 568,
    "g12": 592,
    "g13": 592,
}


def visible_crop(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("asset has no visible pixels")
    return image.crop(bbox)


def fit(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    scale = min(max_width / image.width, max_height / image.height)
    return image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )


def keep_largest_component(image: Image.Image) -> Image.Image:
    """Remove detached hands, feet, and source-atlas fragments from shop art."""
    alpha = image.getchannel("A")
    width, height = image.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    largest: list[tuple[int, int]] = []
    for y in range(height):
        for x in range(width):
            pos = y * width + x
            if visited[pos] or pixels[x, y] <= 12:
                continue
            visited[pos] = 1
            queue = deque([(x, y)])
            component: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx in range(max(0, cx - 1), min(width, cx + 2)):
                    for ny in range(max(0, cy - 1), min(height, cy + 2)):
                        index = ny * width + nx
                        if not visited[index] and pixels[nx, ny] > 12:
                            visited[index] = 1
                            queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component
    mask = Image.new("L", image.size, 0)
    mask_pixels = mask.load()
    for x, y in largest:
        mask_pixels[x, y] = pixels[x, y]
    cleaned = image.copy()
    cleaned.putalpha(mask)
    return cleaned


def centered_canvas(image: Image.Image, size: tuple[int, int], top: int) -> Image.Image:
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(image, ((size[0] - image.width) // 2, top))
    return canvas


def rebuild_g05_lower() -> None:
    source = visible_crop(
        Image.open(SOURCE / "female-g05-lower-socks-alpha-v2.png").convert("RGBA")
    )
    fitted = fit(source, 235, 323)
    module = centered_canvas(fitted, CANVAS, 300)
    module.save(MODULES / "female-g05-lower.png", optimize=True)
    module.save(MODULES / "female-g05-lower-bare.png", optimize=True)


def rebuild_g05_upper() -> None:
    """Match the direct model's shoulder and hand-span coordinates."""
    source = visible_crop(
        Image.open(SOURCE / "female-g05-upper-rig-v1.png").convert("RGBA")
    )
    fitted = source.resize((185, source.height), Image.Resampling.LANCZOS)
    upper = centered_canvas(fitted, CANVAS, 180)
    upper.save(MODULES / "female-g05-upper.png", optimize=True)


def rebuild_g05_shoes() -> None:
    """Align the loafers with the corrected sock-and-foot lower-body module."""
    source = Image.open(SOURCE / "female-g05-shoes-rig-v1.png").convert("RGBA")
    visible = visible_crop(source)
    shoes = centered_canvas(visible, CANVAS, 552)
    shoes.save(MODULES / "female-g05-shoes.png", optimize=True)


def rebuild_bottom_product_art() -> None:
    for code, bottom in GARMENT_BOTTOM.items():
        if code == "g05":
            garment = visible_crop(
                Image.open(SOURCE / "female-g05-skirt-product-alpha-v2.png").convert("RGBA")
            )
        else:
            module = Image.open(MODULES / f"female-{code}-lower.png").convert("RGBA")
            garment = visible_crop(
                keep_largest_component(module.crop((0, 285, CANVAS[0], bottom)))
            )
        fitted = fit(garment, 230, 185)
        product = centered_canvas(fitted, PRODUCT_CANVAS, (PRODUCT_CANVAS[1] - fitted.height) // 2)
        product.save(MODULES / f"female-{code}-lower-product.png", optimize=True)


if __name__ == "__main__":
    rebuild_g05_upper()
    rebuild_g05_lower()
    rebuild_g05_shoes()
    rebuild_bottom_product_art()
