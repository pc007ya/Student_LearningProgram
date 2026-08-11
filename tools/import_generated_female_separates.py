#!/usr/bin/env python3
"""Build body-free shop art and 1000x1900 female garment overlays.

The generated source images contain exactly two floating components on a
chroma-green background.  This importer keeps the shop artwork body-free,
then positions the same pixels on the canonical female body grid.  It does
not repaint, synthesize or substitute the garments during import, so the
product card and the equipped item always match.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "rewards/wardrobe/female-layered-v1"
BASE = Path("/Users/ming/Desktop/紙娃娃＿單一骨架/人物基底/female_Base.png")
CHROMA_HELPER = Path("/Users/ming/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py")
CANVAS = (1000, 1900)
TOP_BOX = (220, 340, 804, 990)


@dataclass(frozen=True)
class Outfit:
    code: str
    slug: str
    title: str
    top_name: str
    bottom_name: str
    source: Path
    color: str
    bottom_box: tuple[int, int, int, int]


OUTFITS = (
    Outfit("g21", "generated-ivory-navy", "IVORY NAVY", "象牙藍滾邊襯衫", "深藍百褶中長裙", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-2e42e6db-1eeb-4c8b-9dc1-188f596d1f9b.png"), "#172554", (260, 710, 740, 1380)),
    Outfit("g22", "generated-rose-charcoal", "ROSE CHARCOAL", "煙粉蝴蝶結真絲上衣", "炭灰高腰寬褲", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-1f3d1531-c326-45e7-8b2a-83bfa2a3a7fc.png"), "#b96f82", (260, 710, 740, 1600)),
    Outfit("g23", "generated-sky-camel", "SKY CAMEL", "霧藍珍珠釦針織上衣", "駝色高腰九分褲", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-8e9eafba-c3f2-47c1-8f40-f788b5adc67e.png"), "#a8c7e8", (315, 710, 710, 1570)),
    Outfit("g24", "generated-burgundy-noir", "BURGUNDY NOIR", "酒紅短版西裝上衣", "黑色箱褶及膝裙", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-b1a94650-293c-41df-bf54-fc5cea20f7b3.png"), "#641d32", (290, 710, 710, 1120)),
    Outfit("g25", "generated-navy-ivory", "NAVY IVORY", "深藍現代水手針織上衣", "象牙百褶中長裙", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-f27863a4-ddb7-4b96-9c2e-38321b78d5b3.png"), "#172554", (260, 710, 740, 1380)),
    Outfit("g26", "generated-lavender-check", "LAVENDER CHECK", "薰衣草羅紋高領上衣", "炭灰薰衣草格紋中長裙", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-1765aa95-d862-4df3-a521-86e941d947b6.png"), "#a77bc8", (260, 710, 740, 1380)),
    Outfit("g27", "generated-denim-rust", "DENIM RUST", "靛藍短版丹寧外套", "赤陶工裝及膝裙", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-339ce6ec-5765-48e3-9d54-6b773f561131.png"), "#264d78", (280, 710, 720, 1140)),
    Outfit("g28", "generated-black-stage", "BLACK STAGE", "黑色不對稱緞面上衣", "炭黑高腰寬褲", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-886b5b3c-3a6d-48b0-83c4-72fcecdfd990.png"), "#202124", (260, 710, 740, 1600)),
    Outfit("g29", "generated-champagne-plum", "CHAMPAGNE PLUM", "香檳蝴蝶結緞面上衣", "深梅紫褶襉中長裙", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-daf7d9bd-59bc-42a7-840a-58f1e1e34de4.png"), "#6c274f", (260, 710, 740, 1380)),
    Outfit("g30", "generated-sky-sport", "SKY SPORT", "白藍機能拉鍊外套", "深藍直筒運動長褲", Path("/Users/ming/.codex/generated_images/019fbba0-6648-7c80-b20e-b416879c5cdc/exec-d4f2a9b5-9e43-4a00-ac07-3aec32a44592.png"), "#446b9e", (315, 710, 710, 1580)),
)


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError("empty alpha image")
    return bbox


def split_components(image: Image.Image) -> tuple[Image.Image, Image.Image, tuple[int, int]]:
    """Split the two garments by connectivity around the central waist gap."""
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("chroma removal produced an empty image")
    _, y0, _, y1 = bbox
    rows = []
    pixels = alpha.load()
    # Sleeves extend past the waist, so the whole row is not empty. Measure
    # only the central torso/waist band to locate the deliberate separation.
    x_start, x_end = round(alpha.width * .30), round(alpha.width * .70)
    row_threshold = max(8, round((x_end - x_start) * .02))
    for y in range(y0, y1):
        rows.append(sum(pixels[x, y] > 200 for x in range(x_start, x_end)) >= row_threshold)

    runs: list[tuple[int, int]] = []
    start = None
    for offset, occupied in enumerate(rows):
        y = y0 + offset
        if not occupied and start is None:
            start = y
        elif occupied and start is not None:
            runs.append((start, y))
            start = None
    if start is not None:
        runs.append((start, y1))

    middle_runs = [run for run in runs if y0 + (y1 - y0) * .20 < sum(run) / 2 < y0 + (y1 - y0) * .62]
    # A neck bow can hang into the visual waist gap. Connectivity is the
    # authoritative separator; the horizontal run is recorded only for QA.
    gap = max(middle_runs, key=lambda run: run[1] - run[0]) if middle_runs else (0, 0)
    # Generated chroma sources can retain a low-opacity rectangular studio
    # wash (typically alpha ~= 185).  It is not part of either garment and,
    # when treated as foreground, flood-fill turns the whole wash into the
    # selected component.  Real garment pixels are solid, so use a stricter
    # seed/component threshold while retaining the original antialiased alpha
    # after the connected component has been selected.
    binary = alpha.point(lambda value: 255 if value > 220 else 0)

    def seed_for(start_y: int, end_y: int, reverse: bool = False) -> tuple[int, int]:
        y_range = range(end_y - 1, start_y - 1, -1) if reverse else range(start_y, end_y)
        for y in y_range:
            for offset in range(alpha.width // 2):
                for x in (alpha.width // 2 - offset, alpha.width // 2 + offset):
                    if 0 <= x < alpha.width and binary.getpixel((x, y)) == 255:
                        return x, y
        raise RuntimeError(f"no component seed in Y={start_y}..{end_y}")

    def connected_component(seed: tuple[int, int]) -> Image.Image:
        flood = binary.copy()
        ImageDraw.floodfill(flood, seed, 128, thresh=0)
        component_mask = flood.point(lambda value: 255 if value == 128 else 0)
        component = image.copy()
        component.putalpha(ImageChops.multiply(alpha, component_mask))
        return component.crop(alpha_bbox(component))

    midpoint = y0 + (y1 - y0) // 2
    top = connected_component(seed_for(y0, midpoint))
    bottom = connected_component(seed_for(midpoint, y1, reverse=True))
    return top, bottom, gap


def fit_component(component: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = box
    max_w, max_h = x1 - x0, y1 - y0
    scale = min(max_w / component.width, max_h / component.height)
    size = (max(1, round(component.width * scale)), max(1, round(component.height * scale)))
    resized = component.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    px = x0 + (max_w - size[0]) // 2
    py = y0 + (max_h - size[1]) // 2
    canvas.alpha_composite(resized, (px, py))
    return remove_residual_key_edge(canvas)


def shop_card(component: Image.Image) -> Image.Image:
    component = component.crop(alpha_bbox(component))
    canvas = Image.new("RGBA", (800, 800), (0, 0, 0, 0))
    scale = min(680 / component.width, 680 / component.height)
    size = (max(1, round(component.width * scale)), max(1, round(component.height * scale)))
    resized = component.resize(size, Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((800 - size[0]) // 2, (800 - size[1]) // 2))
    return remove_residual_key_edge(canvas)


def remove_residual_key_edge(image: Image.Image) -> Image.Image:
    """Contract the nearly invisible soft-matte fringe after resizing."""
    cleaned = image.copy().convert("RGBA")
    alpha = cleaned.getchannel("A").point(lambda value: 0 if value <= 20 else value)
    cleaned.putalpha(alpha)
    return cleaned


def validate_layer(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    if image.size != CANVAS:
        raise RuntimeError(f"{path} is {image.size}, expected {CANVAS}")
    if not image.getchannel("A").getbbox():
        raise RuntimeError(f"{path} has no visible pixels")
    corners = ((0, 0), (999, 0), (0, 1899), (999, 1899))
    if any(image.getpixel(point)[3] for point in corners):
        raise RuntimeError(f"{path} has non-transparent canvas corners")


def main() -> None:
    if Image.open(BASE).size != CANVAS:
        raise RuntimeError(f"female base must be {CANVAS}")

    requested = set(sys.argv[1:])
    for outfit in OUTFITS:
        if requested and outfit.code not in requested:
            continue
        root = OUTPUT / outfit.slug
        root.mkdir(parents=True, exist_ok=True)
        source_chroma = root / "source-chroma.png"
        source_alpha = root / "source-alpha.png"
        shutil.copy2(outfit.source, source_chroma)
        subprocess.run([
            sys.executable, str(CHROMA_HELPER), "--input", str(source_chroma), "--out", str(source_alpha),
            "--auto-key", "corners", "--soft-matte", "--transparent-threshold", "18",
            "--opaque-threshold", "92", "--edge-contract", "1", "--edge-feather", "0.45",
            "--spill-cleanup", "--force",
        ], check=True)

        alpha = remove_residual_key_edge(Image.open(source_alpha).convert("RGBA"))
        alpha.save(source_alpha, optimize=True)
        top_component, bottom_component, gap = split_components(alpha)
        top_layer = fit_component(top_component, TOP_BOX)
        bottom_layer = fit_component(bottom_component, outfit.bottom_box)
        set_layer = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        set_layer.alpha_composite(bottom_layer)
        set_layer.alpha_composite(top_layer)

        shutil.copy2(BASE, root / "base.png")
        top_layer.save(root / "top.png", optimize=True)
        bottom_layer.save(root / "bot.png", optimize=True)
        set_layer.save(root / "set.png", optimize=True)
        shop_card(top_component).save(root / "shop-top.png", optimize=True)
        shop_card(bottom_component).save(root / "shop-bottom.png", optimize=True)

        manifest = {
            "id": outfit.slug,
            "code": outfit.code,
            "title": outfit.title,
            "audience": "girl",
            "canvas": {"width": 1000, "height": 1900},
            "base": "base.png",
            "parts": {
                "top": {"canvas": "top.png", "shop": "shop-top.png", "name": outfit.top_name},
                "bot": {"canvas": "bot.png", "shop": "shop-bottom.png", "name": outfit.bottom_name},
            },
            "set": "set.png",
            "renderOrder": ["base", "bot", "top"],
            "bodyGrid": {"topBox": list(TOP_BOX), "bottomBox": list(outfit.bottom_box)},
            "sourceGap": list(gap),
            "source": "imagegen chroma wardrobe sheet; body-free top/bottom",
        }
        (root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        validate_layer(root / "top.png")
        validate_layer(root / "bot.png")
        print(outfit.code, root.name, "gap", gap, "top", top_layer.getbbox(), "bottom", bottom_layer.getbbox())


if __name__ == "__main__":
    main()
