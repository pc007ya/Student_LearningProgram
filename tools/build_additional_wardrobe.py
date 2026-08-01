#!/usr/bin/env python3
"""Normalize additional wardrobe atlases to the modular-v3 paper-doll rig."""

from pathlib import Path
import sys

from PIL import Image


CANVAS = (512, 800)
ROW_BOUNDS = {
    "headwear": (0, 220),
    "upper": (210, 670),
    "lower": (640, 1280),
    "shoes": (1220, 1448),
}
TARGET_BOXES = {
    "headwear": (180, 90, 4),
    "upper": (245, 300, 180),
    "lower": (235, 323, 300),
    "shoes": (145, 92, 510),
}


def visible_crop(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("module has no visible pixels")
    return image.crop(bbox)


def fit_visible(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    scale = min(max_width / image.width, max_height / image.height)
    return image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)


def make_module(column: Image.Image, part: str, code: str) -> tuple[Image.Image, Image.Image]:
    start, end = ROW_BOUNDS[part]
    visible = visible_crop(column.crop((0, start, column.width, end)))
    max_width, max_height, top = TARGET_BOXES[part]
    if part == "headwear" and code == "g08":
        max_width, max_height, top = 190, 115, 4
    if part == "upper" and code == "g08":
        top = 125
    fitted = fit_visible(visible, max_width, max_height)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(fitted, ((CANVAS[0] - fitted.width) // 2, top))
    thumb = Image.new("RGBA", (fitted.width + 20, fitted.height + 20), (0, 0, 0, 0))
    thumb.alpha_composite(fitted, (10, 10))
    return canvas, thumb


def main() -> None:
    if len(sys.argv) != 5:
        raise SystemExit("usage: build_additional_wardrobe.py ATLAS_A ATLAS_B OUTPUT_DIR FIRST_CODE")
    atlas_paths = [Path(sys.argv[1]), Path(sys.argv[2])]
    output_dir = Path(sys.argv[3])
    first_code = int(sys.argv[4])
    output_dir.mkdir(parents=True, exist_ok=True)

    code_number = first_code
    for atlas_path in atlas_paths:
        atlas = Image.open(atlas_path).convert("RGBA")
        if atlas.size != (1086, 1448):
            raise ValueError(f"unexpected atlas size: {atlas.size}")
        for column_index in range(3):
            left = round(atlas.width * column_index / 3)
            right = round(atlas.width * (column_index + 1) / 3)
            column = atlas.crop((left, 0, right, atlas.height))
            code = f"g{code_number:02d}"
            for part in ("headwear", "upper", "lower", "shoes"):
                module, thumb = make_module(column, part, code)
                module.save(output_dir / f"female-{code}-{part}.png", optimize=True)
                thumb.save(output_dir / f"female-{code}-{part}-thumb.png", optimize=True)
                if part == "lower":
                    module.save(output_dir / f"female-{code}-lower-bare.png", optimize=True)
            code_number += 1


if __name__ == "__main__":
    main()
