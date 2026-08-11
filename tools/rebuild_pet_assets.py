#!/usr/bin/env python3
"""Rebuild realistic pet shop/canvas assets from the original 5x2 sheet.

The green key is removed from the *whole* source sheet before subjects are
detected.  Each pet is then selected by the logical centre of its grid cell.
This is intentionally not a fixed-cell crop: wide features such as the pony's
mane/tail and the parrot's beak/tail feathers may cross a nominal cell edge.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "rewards/pets/source/realistic-pets-grid.png"
OUTPUT = ROOT / "rewards/pets"
SHOP_SIZE = (640, 640)
SHOP_PADDING = 40
CANVAS_SIZE = (1000, 1900)
CANVAS_ANCHOR = (680, 980)
CANVAS_MAX = (300, 360)
PETS = [
    ("british-cat", 0, 0),
    ("shiba", 1, 0),
    ("papillon", 2, 0),
    ("pony", 3, 0),
    ("golden-retriever", 4, 0),
    ("owl", 0, 1),
    ("ferret", 1, 1),
    ("fox", 2, 1),
    ("parrot", 3, 1),
    ("rabbit", 4, 1),
]


def remove_green(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    out = Image.new("RGBA", image.size)
    src = image.load()
    dst = out.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = src[x, y]
            # The sheet key varies slightly around RGB(3, 250, 3).  Distance
            # gives a soft antialiased edge while green dominance catches its
            # compressed/illuminated variants.
            distance = ((r - 3) ** 2 + (g - 250) ** 2 + (b - 3) ** 2) ** 0.5
            dominance = g - max(r, b)
            if distance <= 18 or (g > 155 and dominance > 92):
                alpha = 0
            elif distance >= 90 or dominance < 28:
                alpha = 255
            else:
                alpha = round(max(0.0, min(1.0, (distance - 18) / 72)) * 255)
            if alpha:
                # Suppress the key colour from translucent boundary pixels.
                clean_g = min(g, round(max(r, b) * 1.08 + 8)) if dominance > 20 else g
                dst[x, y] = (r, clean_g, b, alpha)
    return out


def foreground_components(image: Image.Image) -> list[list[tuple[int, int]]]:
    alpha = image.getchannel("A")
    pixels = alpha.load()
    width, height = image.size
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] < 20 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            component: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] >= 20 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            components.append(component)

    return components


def keep_target_component(
    image: Image.Image,
    target: tuple[float, float],
    components: list[list[tuple[int, int]]] | None = None,
) -> Image.Image:
    components = components or foreground_components(image)
    if not components:
        raise RuntimeError("No foreground component found")

    tx, ty = target
    # Prefer a component that contains the intended logical-cell centre.  If
    # fur/body geometry leaves the exact centre transparent, use a combination
    # of size and distance so a large neighbouring animal cannot win.
    def score(component: list[tuple[int, int]]) -> float:
        min_x = min(p[0] for p in component)
        max_x = max(p[0] for p in component)
        min_y = min(p[1] for p in component)
        max_y = max(p[1] for p in component)
        cx = (min_x + max_x) / 2
        cy = (min_y + max_y) / 2
        contains = min_x <= tx <= max_x and min_y <= ty <= max_y
        distance = ((cx - tx) ** 2 + (cy - ty) ** 2) ** 0.5
        return len(component) * (3 if contains else 1) - distance * 180

    selected = max(components, key=score)
    keep = set(selected)
    result = Image.new("RGBA", image.size)
    src = image.load()
    dst = result.load()
    for x, y in keep:
        dst[x, y] = src[x, y]
    return result


def visible_crop(image: Image.Image) -> Image.Image:
    box = image.getchannel("A").getbbox()
    if not box:
        raise RuntimeError("Foreground became empty")
    return image.crop(box)


def fit(image: Image.Image, max_size: tuple[int, int]) -> Image.Image:
    scale = min(max_size[0] / image.width, max_size[1] / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def remove_resample_islands(image: Image.Image) -> Image.Image:
    """Discard isolated low-alpha pixels introduced by Lanczos resampling."""
    return visible_crop(keep_target_component(image, (image.width / 2, image.height / 2)))


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    keyed_source = remove_green(source)
    source_components = foreground_components(keyed_source)
    cell_w = source.width / 5
    cell_h = source.height / 2

    built: list[tuple[str, Image.Image]] = []
    for name, column, row in PETS:
        target = ((column + 0.5) * cell_w, (row + 0.5) * cell_h)
        pet = visible_crop(keep_target_component(keyed_source, target, source_components))

        shop_pet = remove_resample_islands(fit(pet, (SHOP_SIZE[0] - SHOP_PADDING * 2, SHOP_SIZE[1] - SHOP_PADDING * 2)))
        shop = Image.new("RGBA", SHOP_SIZE)
        shop.alpha_composite(shop_pet, ((SHOP_SIZE[0] - shop_pet.width) // 2, (SHOP_SIZE[1] - shop_pet.height) // 2))
        shop.save(OUTPUT / f"{name}-shop.png", optimize=True)
        built.append((name, shop))

        canvas_pet = remove_resample_islands(fit(pet, CANVAS_MAX))
        canvas = Image.new("RGBA", CANVAS_SIZE)
        canvas.alpha_composite(canvas_pet, (round(CANVAS_ANCHOR[0] - canvas_pet.width / 2), CANVAS_ANCHOR[1]))
        canvas.save(OUTPUT / f"{name}-1000x1900.png", optimize=True)
        print(f"{name}: pet={pet.size}, shop={shop_pet.size}, canvas={canvas_pet.size}")

    qa_dir = OUTPUT / "qa"
    qa_dir.mkdir(exist_ok=True)
    tile = (320, 350)
    sheet = Image.new("RGBA", (tile[0] * 5, tile[1] * 2), (25, 19, 62, 255))
    draw = ImageDraw.Draw(sheet)
    for index, (name, shop) in enumerate(built):
        thumb = fit(shop, (270, 270))
        x = index % 5 * tile[0]
        y = index // 5 * tile[1]
        sheet.alpha_composite(thumb, (x + (tile[0] - thumb.width) // 2, y + 12))
        draw.text((x + 16, y + 302), name, fill=(255, 255, 255, 255))
        draw.text((x + 16, y + 323), "full-sheet outline · 1 connected subject", fill=(160, 238, 229, 255))
    sheet.save(qa_dir / "pet-shop-contact-sheet.png", optimize=True)


if __name__ == "__main__":
    main()
