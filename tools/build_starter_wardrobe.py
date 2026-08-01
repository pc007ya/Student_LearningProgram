#!/usr/bin/env python3
"""Split the three original female starter looks into modular-v3 assets."""

from pathlib import Path
import sys

from PIL import Image


CANVAS = (512, 800)
ROW_BOUNDS = {
    "head": (0, 190),
    "upper": (180, 535),
    "lower": (520, 1070),
    "shoes": (1050, 1254),
}
TARGET_BOXES = {
    "head": (130, 175, 20),
    "upper": (245, 300, 180),
    "lower": (235, 323, 300),
    "shoes": (82, 60, 580),
}
STYLE_KEYS = ("atelier-v4", "creative-v4", "performance-v4")


def visible_crop(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("module has no visible pixels")
    return image.crop(bbox)


def fit_visible(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    scale = min(max_width / image.width, max_height / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    return image.resize(size, Image.Resampling.LANCZOS)


def make_module(column: Image.Image, part: str) -> tuple[Image.Image, Image.Image]:
    start, end = ROW_BOUNDS[part]
    visible = visible_crop(column.crop((0, start, column.width, end)))
    max_width, max_height, top = TARGET_BOXES[part]
    fitted = fit_visible(visible, max_width, max_height)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(fitted, ((CANVAS[0] - fitted.width) // 2, top))
    thumb = Image.new("RGBA", (fitted.width + 20, fitted.height + 20), (0, 0, 0, 0))
    thumb.alpha_composite(fitted, (10, 10))
    return canvas, thumb


def make_hair_overlay(column: Image.Image) -> tuple[Image.Image, Image.Image]:
    visible = visible_crop(column)
    fitted = fit_visible(visible, 900, 1080)
    canvas = Image.new("RGBA", (1254, 1254), (0, 0, 0, 0))
    canvas.alpha_composite(fitted, ((1254 - fitted.width) // 2, 60))
    thumb = fit_visible(visible, 180, 180)
    return canvas, thumb


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: build_starter_wardrobe.py OUTFIT_ATLAS HAIR_ATLAS OUTPUT_DIR")
    atlas = Image.open(sys.argv[1]).convert("RGBA")
    hair_atlas = Image.open(sys.argv[2]).convert("RGBA")
    if atlas.size != (1254, 1254):
        raise ValueError(f"unexpected atlas size: {atlas.size}")
    if hair_atlas.size != (1774, 887):
        raise ValueError(f"unexpected hair atlas size: {hair_atlas.size}")
    output_dir = Path(sys.argv[3])
    output_dir.mkdir(parents=True, exist_ok=True)

    for column_index, style_key in enumerate(STYLE_KEYS):
        left = round(atlas.width * column_index / 3)
        right = round(atlas.width * (column_index + 1) / 3)
        column = atlas.crop((left, 0, right, atlas.height))
        code = f"g{11 + column_index:02d}"
        for part in ("head", "upper", "lower", "shoes"):
            module, thumb = make_module(column, part)
            if part == "head":
                stem = f"female-head-{style_key}"
            else:
                stem = f"female-{code}-{part}"
            module.save(output_dir / f"{stem}.png", optimize=True)
            thumb.save(output_dir / f"{stem}-thumb.png", optimize=True)
            if part == "lower":
                module.save(output_dir / f"female-{code}-lower-bare.png", optimize=True)

        hair_left = round(hair_atlas.width * column_index / 3)
        hair_right = round(hair_atlas.width * (column_index + 1) / 3)
        hair_column = hair_atlas.crop((hair_left, 0, hair_right, hair_atlas.height))
        hair, hair_thumb = make_hair_overlay(hair_column)
        hair.save(output_dir / f"female-hair-{style_key}.png", optimize=True)
        hair_thumb.save(output_dir / f"female-hair-{style_key}-thumb.png", optimize=True)


if __name__ == "__main__":
    main()
