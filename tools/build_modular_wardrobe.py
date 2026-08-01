#!/usr/bin/env python3
"""Build aligned transparent paper-doll modules from approved chroma atlases."""

from pathlib import Path
import sys

from PIL import Image


OUTFIT_CODES = ("g01", "g02", "g04")
HEAD_CODES = ("base", "bob", "ponytail", "wavy-lob", "twin-braids")
CANVAS = (512, 800)


def isolated_row(column: Image.Image, source_box: tuple[int, int], target_y: int) -> Image.Image:
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    row = column.crop((0, source_box[0], column.width, source_box[1]))
    bbox = alpha_bbox(row)
    visible_center = (bbox[0] + bbox[2]) / 2
    target_x = round(CANVAS[0] / 2 - visible_center)
    canvas.alpha_composite(row, (target_x, target_y))
    return canvas


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("module has no visible pixels")
    return bbox


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: build_modular_wardrobe.py OUTFIT_ALPHA HEAD_ALPHA OUTPUT_DIR")
    outfit_path, head_path, output_dir = map(Path, sys.argv[1:])
    output_dir.mkdir(parents=True, exist_ok=True)
    outfits = Image.open(outfit_path).convert("RGBA")
    heads = Image.open(head_path).convert("RGBA")

    if outfits.size != (1536, 1024):
        raise ValueError(f"unexpected outfit atlas size: {outfits.size}")

    for column_index, code in enumerate(OUTFIT_CODES):
        column = outfits.crop((column_index * 512, 0, (column_index + 1) * 512, 1024))
        # The target positions close the deliberately large atlas gaps so neck,
        # waist and ankle joins meet while every garment remains independent.
        modules = {
            "upper": isolated_row(column, (205, 535), 158),
            "lower": isolated_row(column, (530, 822), 370),
            "lower-bare": isolated_row(column, (530, 875), 370),
            "shoes": isolated_row(column, (875, 1024), 630),
        }
        for part, image in modules.items():
            image.save(output_dir / f"female-{code}-{part}.png", optimize=True)

    target_head_height = 175
    target_head_bottom = 195
    for column_index, code in enumerate(HEAD_CODES):
        left = round(heads.width * column_index / len(HEAD_CODES))
        right = round(heads.width * (column_index + 1) / len(HEAD_CODES))
        raw = heads.crop((left, 0, right, heads.height))
        visible = raw.crop(alpha_bbox(raw))
        scale = target_head_height / visible.height
        resized = visible.resize((round(visible.width * scale), target_head_height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(resized, ((CANVAS[0] - resized.width) // 2, target_head_bottom - resized.height))
        canvas.save(output_dir / f"female-head-{code}.png", optimize=True)


if __name__ == "__main__":
    main()
