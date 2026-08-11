#!/usr/bin/env python3
"""Rebuild wardrobe backgrounds from the original 5x2 scene sheet.

The source sheet contains thin white gutters between scenes.  Each cell is
inset before resizing, then cover-cropped so neither the 1000x1900 canvas
asset nor the 420x560 shop preview can expose those gutters.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "rewards/backgrounds/source/scene-grid.png"
OUTPUT = ROOT / "rewards/backgrounds"
QA_OUTPUT = OUTPUT / "qa/background-contact-sheet.png"

SCENES = (
    "classroom",
    "playground",
    "office",
    "seaside",
    "mountain",
    "farm",
    "forest",
    "city",
    "cafe",
    "amusement",
)

# Measured content bounds in the 1536x1024 source.  These exclude the white
# outer frame and the irregular 3-4 px gutters between generated scenes.
SOURCE_COLUMNS = ((3, 306), (310, 609), (613, 913), (916, 1217), (1221, 1533))
SOURCE_ROWS = ((3, 510), (514, 1021))
GUTTER_SAFETY_INSET = 2
CANVAS_SIZE = (1000, 1900)
SHOP_SIZE = (420, 560)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Scale an image to completely fill size, then crop from its centre."""
    target_width, target_height = size
    scale = max(target_width / image.width, target_height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - target_width) // 2
    top = (resized.height - target_height) // 2
    return resized.crop((left, top, left + target_width, top + target_height))


def scene_cell(sheet: Image.Image, index: int) -> Image.Image:
    column = index % len(SOURCE_COLUMNS)
    row = index // len(SOURCE_COLUMNS)
    left, right = SOURCE_COLUMNS[column]
    top, bottom = SOURCE_ROWS[row]
    inset = GUTTER_SAFETY_INSET
    return sheet.crop((left + inset, top + inset, right - inset, bottom - inset))


def edge_white_ratio(image: Image.Image) -> float:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = []
    pixels.extend(rgb.crop((0, 0, width, 1)).get_flattened_data())
    pixels.extend(rgb.crop((0, height - 1, width, height)).get_flattened_data())
    pixels.extend(rgb.crop((0, 0, 1, height)).get_flattened_data())
    pixels.extend(rgb.crop((width - 1, 0, width, height)).get_flattened_data())
    return sum(r >= 245 and g >= 245 and b >= 245 for r, g, b in pixels) / len(pixels)


def build_contact_sheet(previews: list[tuple[str, Image.Image]]) -> None:
    card_width, card_height = 220, 330
    columns = 5
    rows = 2
    sheet = Image.new("RGB", (columns * card_width, rows * card_height), "#17112f")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, (name, preview) in enumerate(previews):
        x = (index % columns) * card_width
        y = (index // columns) * card_height
        thumb = cover(preview, (200, 270))
        sheet.paste(thumb, (x + 10, y + 10))
        draw.text((x + 10, y + 288), name, fill="white", font=font)
        draw.text((x + 10, y + 306), "1000x1900 · edge-filled", fill="#9fe8dd", font=font)
    QA_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(QA_OUTPUT, optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source sheet: {SOURCE}")
    sheet = Image.open(SOURCE).convert("RGB")
    previews = []
    for index, name in enumerate(SCENES):
        cell = scene_cell(sheet, index)
        canvas = cover(cell, CANVAS_SIZE)
        shop = cover(cell, SHOP_SIZE)
        canvas_path = OUTPUT / f"{name}-1000x1900.png"
        shop_path = OUTPUT / f"{name}-shop.png"
        canvas.save(canvas_path, optimize=True)
        shop.save(shop_path, optimize=True)
        previews.append((name, canvas))
        print(
            f"{name:12} source={cell.size} canvas={canvas.size} shop={shop.size} "
            f"edge-white={edge_white_ratio(canvas):.4f}"
        )
    build_contact_sheet(previews)


if __name__ == "__main__":
    main()
