#!/usr/bin/env python3
"""Validate a modular wardrobe outfit against its direct-render reference model.

The check intentionally combines coordinate anchors with alpha-pixel geometry:
module joins must overlap, the assembled silhouette must not contain detached
fragments, and the normalized silhouette must remain close to the direct model.
"""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MODULES = ROOT / "rewards/wardrobe/modular-v3/modules"
REFERENCE = ROOT / "rewards/wardrobe/modular-v3/reference/female-g05-direct-model.png"
PARTS = {
    "head": MODULES / "female-head-base.png",
    "upper": MODULES / "female-g05-upper.png",
    "lower": MODULES / "female-g05-lower.png",
    "shoes": MODULES / "female-g05-shoes.png",
}
CANVAS = (512, 800)


def alpha_mask(image: Image.Image, threshold: int = 20) -> bytearray:
    return bytearray(
        1 if value > threshold else 0
        for value in image.getchannel("A").get_flattened_data()
    )


def mask_bbox(mask: bytearray, width: int, height: int) -> tuple[int, int, int, int]:
    points = [(index % width, index // width) for index, value in enumerate(mask) if value]
    if not points:
        raise ValueError("empty alpha mask")
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def component_sizes(mask: bytearray, width: int, height: int) -> list[int]:
    visited = bytearray(width * height)
    sizes: list[int] = []
    for index, value in enumerate(mask):
        if not value or visited[index]:
            continue
        visited[index] = 1
        queue = deque([index])
        size = 0
        while queue:
            current = queue.popleft()
            size += 1
            x, y = current % width, current // width
            for nx in range(max(0, x - 1), min(width, x + 2)):
                for ny in range(max(0, y - 1), min(height, y + 2)):
                    neighbor = ny * width + nx
                    if mask[neighbor] and not visited[neighbor]:
                        visited[neighbor] = 1
                        queue.append(neighbor)
        sizes.append(size)
    return sorted(sizes, reverse=True)


def overlap_pixels(left: Image.Image, right: Image.Image) -> int:
    left_mask = alpha_mask(left)
    right_mask = alpha_mask(right)
    return sum(1 for a, b in zip(left_mask, right_mask) if a and b)


def normalize_reference(reference: Image.Image, target_bbox: tuple[int, int, int, int]) -> Image.Image:
    source_bbox = reference.getchannel("A").getbbox()
    if source_bbox is None:
        raise ValueError("reference model has no visible pixels")
    visible = reference.crop(source_bbox)
    target_height = target_bbox[3] - target_bbox[1]
    scale = target_height / visible.height
    fitted = visible.resize(
        (round(visible.width * scale), target_height),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    center_x = (target_bbox[0] + target_bbox[2]) // 2
    canvas.alpha_composite(fitted, (center_x - fitted.width // 2, target_bbox[1]))
    return canvas


def silhouette_iou(left: Image.Image, right: Image.Image) -> float:
    left_mask = alpha_mask(left)
    right_mask = alpha_mask(right)
    intersection = sum(1 for a, b in zip(left_mask, right_mask) if a and b)
    union = sum(1 for a, b in zip(left_mask, right_mask) if a or b)
    return intersection / union if union else 0.0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", type=Path, help="optional comparison preview output")
    args = parser.parse_args()

    layers = {name: Image.open(path).convert("RGBA") for name, path in PARTS.items()}
    assembled = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    for name in ("lower", "upper", "head", "shoes"):
        assembled.alpha_composite(layers[name])

    assembled_mask = alpha_mask(assembled)
    assembled_bbox = mask_bbox(assembled_mask, *CANVAS)
    reference = normalize_reference(Image.open(REFERENCE).convert("RGBA"), assembled_bbox)
    reference_bbox = mask_bbox(alpha_mask(reference), *CANVAS)
    components = component_sizes(assembled_mask, *CANVAS)
    significant_components = [size for size in components if size >= 24]
    overlaps = {
        "neck": overlap_pixels(layers["head"], layers["upper"]),
        "waist": overlap_pixels(layers["upper"], layers["lower"]),
        "feet": overlap_pixels(layers["lower"], layers["shoes"]),
    }
    iou = silhouette_iou(assembled, reference)
    center_delta = abs(
        (assembled_bbox[0] + assembled_bbox[2]) / 2
        - (reference_bbox[0] + reference_bbox[2]) / 2
    )
    width_ratio = (assembled_bbox[2] - assembled_bbox[0]) / (
        reference_bbox[2] - reference_bbox[0]
    )

    checks = {
        "single_connected_silhouette": len(significant_components) == 1,
        "neck_join": overlaps["neck"] >= 100,
        "waist_join": overlaps["waist"] >= 300,
        "shoe_join": overlaps["feet"] >= 120,
        "center_alignment": center_delta <= 2,
        "width_ratio": 0.82 <= width_ratio <= 1.22,
        "silhouette_similarity": iou >= 0.62,
    }
    report = {
        "passed": all(checks.values()),
        "checks": checks,
        "coordinates": {
            "assembled_bbox": assembled_bbox,
            "reference_bbox": reference_bbox,
            "center_delta_px": round(center_delta, 2),
            "width_ratio": round(width_ratio, 4),
        },
        "pixels": {
            "significant_components": significant_components,
            "join_overlap": overlaps,
            "silhouette_iou": round(iou, 4),
        },
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))

    if args.preview:
        preview = Image.new("RGBA", (CANVAS[0] * 2, CANVAS[1]), (28, 20, 54, 255))
        preview.alpha_composite(reference, (0, 0))
        preview.alpha_composite(assembled, (CANVAS[0], 0))
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        preview.save(args.preview, optimize=True)

    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
