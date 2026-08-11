#!/usr/bin/env python3
"""Build 1000x1900 wardrobe overlays from the body-grid coordinate guide.

The guide defines the female body on a 1000x1900 canvas.  This script keeps
every accessory on that unchanged canvas and uses the following anchors:

* head: X 435..593, Y 120..340
* neck: X 454..573, Y 340..390
* screen-left hand: X about 253, fingertips Y about 990
* screen-right hand: X about 747, fingertips Y about 990
* feet: left X 375..480, right X 548..650, sole Y about 1617

Shop art remains separate.  These outputs are only for the full-size avatar
stack, so CSS never needs to guess an accessory position from percentages.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CANVAS_SIZE = (1000, 1900)
OUTPUT = ROOT / "rewards/wardrobe/grid-aligned-v1"
BASE = ROOT / "rewards/wardrobe/female-layered-v1/sports-bra-cargo-shorts/base.png"


def visible(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    box = image.getchannel("A").getbbox()
    if not box:
        raise RuntimeError("Accessory source is empty")
    return image.crop(box)


def fit(image: Image.Image, maximum: tuple[int, int]) -> Image.Image:
    scale = min(maximum[0] / image.width, maximum[1] / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def place(image: Image.Image, center_x: int, top: int, maximum: tuple[int, int]) -> Image.Image:
    item = fit(visible(image), maximum)
    canvas = Image.new("RGBA", CANVAS_SIZE)
    canvas.alpha_composite(item, (round(center_x - item.width / 2), top))
    return canvas


def place_bottom(image: Image.Image, center_x: int, bottom: int, maximum: tuple[int, int]) -> Image.Image:
    item = fit(visible(image), maximum)
    canvas = Image.new("RGBA", CANVAS_SIZE)
    canvas.alpha_composite(item, (round(center_x - item.width / 2), bottom - item.height))
    return canvas


def save(image: Image.Image, relative: str) -> None:
    path = OUTPUT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def split_shoes(image: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Recover the two disconnected shoes from an authored full-canvas pair."""
    image = image.convert("RGBA")
    left = visible(image.crop((0, 0, 500, image.height)))
    right = visible(image.crop((500, 0, image.width, image.height)))
    return left, right


def build_hats() -> None:
    sources = {
        "accessory-01": "rewards/items/beret-black.png",
        "accessory-02": "rewards/items/hat-baseball-navy.png",
        "accessory-03": "rewards/items/hat-bucket-camel.png",
        "accessory-04": "rewards/items/hat-beanie-charcoal.png",
        "accessory-05": "rewards/items/hat-newsboy-ivory.png",
        "accessory-06": "rewards/wardrobe/modular-v3/modules/female-g05-headwear.png",
        "accessory-07": "rewards/wardrobe/modular-v3/modules/female-g06-headwear.png",
        "accessory-08": "rewards/wardrobe/modular-v3/modules/female-g07-headwear.png",
        "accessory-09": "rewards/wardrobe/modular-v3/modules/female-g08-headwear.png",
        "accessory-10": "rewards/wardrobe/modular-v3/modules/female-g09-headwear.png",
        "accessory-11": "rewards/wardrobe/modular-v3/modules/female-g10-headwear.png",
        "accessory-12": "rewards/wardrobe/female-layered-v1/sheet-campus-sailor/hat.png",
        "accessory-13": "rewards/wardrobe/female-layered-v1/sheet-academy-noir/hat.png",
        "accessory-14": "rewards/wardrobe/female-layered-v1/sheet-modern-academy/hat.png",
    }
    for item_id, relative in sources.items():
        # Hat centre follows the guide's body centre X≈512.  The crown may
        # extend above the head, but the lower edge stays near the forehead.
        result = place_bottom(Image.open(ROOT / relative), 512, 245, (250, 175))
        save(result, f"hats/{item_id}.png")


def build_neckwear() -> None:
    sources = {
        "neck-01": ("formal-scarf-navy", "scarf"),
        "neck-02": ("formal-scarf-ivory", "scarf"),
        "neck-03": ("formal-tie-burgundy", "tie"),
        "neck-05": ("formal-chain-silver", "necklace"),
        "neck-06": ("formal-bow-black", "bow"),
        "neck-08": ("formal-scarf-forest", "scarf"),
        "neck-10": ("formal-tie-midnight", "tie"),
        "neck-11": ("formal-scarf-tricolor", "scarf"),
        "neck-12": ("formal-scarf-pearl-white", "scarf"),
    }
    approved_full_canvas = {
        "neck-01", "neck-02", "neck-03", "neck-05", "neck-06", "neck-08", "neck-10"
    }
    layout = {
        "scarf": (345, (150, 205)),
        "tie": (350, (100, 210)),
        "necklace": (350, (175, 190)),
        "bow": (350, (150, 86)),
    }
    for item_id, (key, kind) in sources.items():
        if item_id in approved_full_canvas:
            # Approved wardrobe sources already use the canonical female body
            # grid. Preserve their authored 1000x1900 coordinates exactly.
            source_image = Image.open(
                ROOT / f"rewards/neckwear/{key}-approved-1000x1900.png"
            ).convert("RGBA")
            if source_image.size != CANVAS_SIZE:
                raise RuntimeError(f"{item_id} approved source must be 1000x1900")
            save(source_image, f"neck/{item_id}.png")
            continue
        if item_id in {"neck-11", "neck-12"}:
            # These scarves are authored as front-only garments.  Their rear
            # collar sections stay transparent because those portions belong
            # behind the avatar's neck, not on this foreground overlay.
            source = ROOT / f"rewards/neckwear/{key}-front-only.png"
            if item_id == "neck-11":
                top, maximum = 338, (245, 315)
            else:
                top, maximum = 342, (245, 205)
        else:
            source = ROOT / f"rewards/neckwear/{key}-1000x1900.png"
            top, maximum = layout[kind]
        source_image = Image.open(source)
        save(place(source_image, 512, top, maximum), f"neck/{item_id}.png")

def build_hands() -> None:
    layouts = {
        "hand-01": (70, 150, 1005),
        "hand-02": (220, 320, 1040),
        "hand-03": (150, 230, 1030),
        "hand-04": (145, 215, 1030),
        "hand-05": (145, 215, 1030),
        "hand-06": (150, 210, 1025),
        "hand-07": (90, 220, 1030),
        "hand-08": (110, 270, 1040),
    }
    for item_id, (max_w, max_h, bottom) in layouts.items():
        if item_id == "hand-01":
            left_source = Image.open(ROOT / "rewards/items/modular-v2/hand-01-left.png")
            right_source = Image.open(ROOT / "rewards/items/modular-v2/hand-01-right.png")
        else:
            right_source = Image.open(ROOT / f"rewards/items/modular-v2/{item_id}.png")
            left_source = right_source.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        # Slot names use screen coordinates, matching the PDF table.
        save(place_bottom(left_source, 253, bottom, (max_w, max_h)), f"hands/{item_id}-left.png")
        save(place_bottom(right_source, 747, bottom, (max_w, max_h)), f"hands/{item_id}-right.png")


def build_shoes() -> None:
    sources = {
        "shoes-14": "sheet-atelier",
        "shoes-15": "sheet-creative",
        "shoes-16": "sheet-performance",
        "shoes-17": "sheet-campus-sailor",
        "shoes-18": "sheet-academy-noir",
        "shoes-19": "sheet-modern-academy",
    }
    for item_id, folder in sources.items():
        source = Image.open(ROOT / f"rewards/wardrobe/female-layered-v1/{folder}/shoe.png")
        left, right = split_shoes(source)
        canvas = Image.new("RGBA", CANVAS_SIZE)
        left = fit(left, (100, 112))
        right = fit(right, (100, 112))
        canvas.alpha_composite(left, (round(427 - left.width / 2), 1635 - left.height))
        canvas.alpha_composite(right, (round(599 - right.width / 2), 1635 - right.height))
        save(canvas, f"shoes/{item_id}.png")


def make_qa_sheet() -> None:
    base = Image.open(BASE).convert("RGBA")
    samples = [
        ("帽子", OUTPUT / "hats/accessory-12.png"),
        ("領巾", OUTPUT / "neck/neck-01.png"),
        ("紅藍金領巾", OUTPUT / "neck/neck-11.png"),
        ("珍珠絲巾", OUTPUT / "neck/neck-12.png"),
        ("左手", OUTPUT / "hands/hand-03-left.png"),
        ("右手", OUTPUT / "hands/hand-04-right.png"),
        ("鞋子", OUTPUT / "shoes/shoes-17.png"),
    ]
    tile_w, tile_h = 360, 720
    sheet = Image.new("RGBA", (tile_w * len(samples), tile_h), (29, 22, 66, 255))
    draw = ImageDraw.Draw(sheet)
    for index, (label, path) in enumerate(samples):
        preview = Image.new("RGBA", CANVAS_SIZE)
        preview.alpha_composite(base)
        preview.alpha_composite(Image.open(path).convert("RGBA"))
        preview.thumbnail((310, 620), Image.Resampling.LANCZOS)
        x = index * tile_w + (tile_w - preview.width) // 2
        sheet.alpha_composite(preview, (x, 18))
        draw.text((index * tile_w + 18, 664), label, fill=(255, 255, 255, 255))
        draw.text((index * tile_w + 18, 686), "1000x1900 grid aligned", fill=(151, 228, 222, 255))
    save(sheet, "qa/accessory-grid-contact-sheet.png")


def main() -> None:
    build_hats()
    build_neckwear()
    build_hands()
    build_shoes()
    make_qa_sheet()
    print("Built grid-aligned hats, neckwear, left/right hand props, and shoes.")


if __name__ == "__main__":
    main()
