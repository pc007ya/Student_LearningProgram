#!/usr/bin/env python3
"""Build six-frame website pet animations from approved 2x6 alpha sheets."""

from __future__ import annotations

import argparse
from collections import deque
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ACTIONS = {
    "british-cat": ("yawn", "scratch"),
    "shiba": ("yawn", "scratch"),
    "papillon": ("blink", "scratch"),
    "pony": ("nod", "paw"),
    "golden-retriever": ("yawn", "tail"),
    "owl": ("blink", "wings"),
    "ferret": ("yawn", "groom"),
    "fox": ("yawn", "scratch"),
    "parrot": ("blink", "wings"),
    "rabbit": ("blink", "groom"),
}

FRAME_SIZE = 256
PADDING = 20
SOURCE_SLOT_OVERLAP = 0.15
PRIORITY_EDGE_CHECKS = (
    ("parrot", "wings", "parrot wings"),
    ("fox", "yawn", "fox tail / yawn"),
    ("fox", "scratch", "fox tail / scratch"),
    ("ferret", "yawn", "ferret tail / yawn"),
    ("ferret", "groom", "ferret tail / groom"),
    ("golden-retriever", "tail", "golden retriever tail"),
    ("papillon", "blink", "papillon tail / blink"),
    ("papillon", "scratch", "papillon tail / scratch"),
)


def alpha_bbox(image: Image.Image):
    return image.getchannel("A").getbbox()


def edge_margins(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = alpha_bbox(image)
    if not bbox:
        raise ValueError("empty animation frame")
    return bbox[0], bbox[1], image.width - bbox[2], image.height - bbox[3]


def extract_pose_groups(image: Image.Image) -> tuple[list[list[Image.Image]], list[list[dict]]]:
    """Recover all 12 complete poses before slot normalization.

    Generated poses may cross a nominal 2x6 cell boundary.  We therefore use
    the requested 15% overlapping slots only to associate each pose with its
    row/column, then retain the pose's complete connected component.  This
    avoids cutting wings, tails, ears, or hooves at a slot edge.
    """
    alpha = image.getchannel("A")
    width, height = image.size
    values = bytearray(alpha.tobytes())
    visible = bytearray(1 if value > 10 else 0 for value in values)
    visited = bytearray(width * height)
    components: list[list[int]] = []
    for start in range(width * height):
        if not visible[start] or visited[start]:
            continue
        queue = deque([start])
        visited[start] = 1
        component = []
        while queue:
            index = queue.popleft()
            component.append(index)
            x, y = index % width, index // width
            for neighbor in (index - 1, index + 1, index - width, index + width):
                if neighbor < 0 or neighbor >= width * height:
                    continue
                nx, ny = neighbor % width, neighbor // width
                if abs(nx - x) + abs(ny - y) != 1:
                    continue
                if visible[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        if len(component) >= 100:
            components.append(component)

    # Tiny detached pixels and chroma-removal dust are never pose candidates.
    components = sorted(components, key=len, reverse=True)[:12]
    if len(components) != 12:
        raise ValueError(f"expected 12 complete pose components, found {len(components)}")

    recovered = []
    for component in components:
        keep = bytearray(width * height)
        kept_indices = list(component)
        frontier = list(component)
        for index in component:
            keep[index] = 1
        # Restore two pixels of antialiasing around the connected silhouette.
        for _ in range(2):
            next_frontier = []
            for index in frontier:
                x, y = index % width, index // width
                for neighbor in (index - 1, index + 1, index - width, index + width):
                    if neighbor < 0 or neighbor >= width * height or keep[neighbor]:
                        continue
                    nx, ny = neighbor % width, neighbor // width
                    if abs(nx - x) + abs(ny - y) == 1 and values[neighbor] > 0:
                        keep[neighbor] = 1
                        kept_indices.append(neighbor)
                        next_frontier.append(neighbor)
            frontier = next_frontier

        xs = [index % width for index in kept_indices]
        ys = [index // width for index in kept_indices]
        left, top, right, bottom = min(xs), min(ys), max(xs) + 1, max(ys) + 1
        if min(left, top, width - right, height - bottom) < 3:
            raise ValueError(f"source pose touches outer canvas edge: {(left, top, right, bottom)}")
        crop = image.crop((left, top, right, bottom))
        crop_alpha = bytearray(crop.width * crop.height)
        for index in kept_indices:
            x, y = index % width, index // width
            crop_alpha[(y - top) * crop.width + (x - left)] = values[index]
        crop.putalpha(Image.frombytes("L", crop.size, bytes(crop_alpha)))
        recovered.append({
            "image": crop,
            "bbox": (left, top, right, bottom),
            "center": ((left + right) / 2, (top + bottom) / 2),
            "area": len(component),
        })

    # The generated source is two coherent rows of six poses.  Clustering by
    # vertical center is more robust than cutting at height/2 for tall wings.
    recovered.sort(key=lambda item: item["center"][1])
    rows = [sorted(recovered[:6], key=lambda item: item["center"][0]), sorted(recovered[6:], key=lambda item: item["center"][0])]
    cell_width, cell_height = width / 6, height / 2
    images: list[list[Image.Image]] = [[], []]
    reports: list[list[dict]] = [[], []]
    for row_index, row in enumerate(rows):
        for column, item in enumerate(row):
            overlap_x, overlap_y = cell_width * SOURCE_SLOT_OVERLAP, cell_height * SOURCE_SLOT_OVERLAP
            slot = (
                max(0, column * cell_width - overlap_x),
                max(0, row_index * cell_height - overlap_y),
                min(width, (column + 1) * cell_width + overlap_x),
                min(height, (row_index + 1) * cell_height + overlap_y),
            )
            bbox = item["bbox"]
            intersection = (
                max(0, min(bbox[2], slot[2]) - max(bbox[0], slot[0]))
                * max(0, min(bbox[3], slot[3]) - max(bbox[1], slot[1]))
            )
            bbox_area = max(1, (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]))
            overlap_ratio = intersection / bbox_area
            if overlap_ratio < 0.60:
                raise ValueError(f"pose cannot be matched to 15% overlap slot row={row_index} column={column}: {overlap_ratio:.3f}")
            images[row_index].append(item["image"])
            reports[row_index].append({
                "source_bbox": bbox,
                "source_area": item["area"],
                "slot_overlap_ratio": round(overlap_ratio, 4),
            })
    return images, reports


def keep_primary_component(image: Image.Image) -> Image.Image:
    """Remove neighboring-frame fragments while preserving one connected pet."""
    alpha = image.getchannel("A")
    width, height = image.size
    values = bytearray(alpha.tobytes())
    visible = bytearray(1 if value > 10 else 0 for value in values)
    visited = bytearray(width * height)
    components: list[list[int]] = []
    for start in range(width * height):
        if not visible[start] or visited[start]:
            continue
        queue = deque([start])
        visited[start] = 1
        component = []
        while queue:
            index = queue.popleft()
            component.append(index)
            x, y = index % width, index // width
            for neighbor in (index - 1, index + 1, index - width, index + width):
                if neighbor < 0 or neighbor >= width * height:
                    continue
                nx, ny = neighbor % width, neighbor // width
                if abs(nx - x) + abs(ny - y) != 1:
                    continue
                if visible[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        components.append(component)
    if not components:
        return image
    primary = max(components, key=len)
    keep = bytearray(width * height)
    for index in primary:
        keep[index] = 1
    # Restore antialiased edge pixels immediately touching the retained body.
    for _ in range(2):
        expanded = keep[:]
        for index, is_kept in enumerate(keep):
            if not is_kept:
                continue
            x, y = index % width, index // width
            for neighbor in (index - 1, index + 1, index - width, index + width):
                if 0 <= neighbor < width * height:
                    nx, ny = neighbor % width, neighbor // width
                    if abs(nx - x) + abs(ny - y) == 1 and values[neighbor] > 0:
                        expanded[neighbor] = 1
        keep = expanded
    cleaned = image.copy()
    cleaned_alpha = bytearray(values)
    for index in range(width * height):
        if not keep[index]:
            cleaned_alpha[index] = 0
    cleaned.putalpha(Image.frombytes("L", (width, height), bytes(cleaned_alpha)))
    return cleaned


def normalize_row(cells: list[Image.Image]) -> list[Image.Image]:
    crops = []
    for raw_cell in cells:
        cell = keep_primary_component(raw_cell)
        bbox = alpha_bbox(cell)
        if not bbox:
            raise ValueError("empty animation frame")
        crops.append(cell.crop(bbox))

    max_width = max(c.width for c in crops)
    max_height = max(c.height for c in crops)
    scale = min(
        (FRAME_SIZE - PADDING * 2) / max_width,
        (FRAME_SIZE - PADDING * 2) / max_height,
    )
    normalized = []
    for crop in crops:
        size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        sprite = crop.resize(size, Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        x = (FRAME_SIZE - sprite.width) // 2
        y = FRAME_SIZE - PADDING - sprite.height
        frame.alpha_composite(sprite, (x, y))
        normalized.append(frame)
    return normalized


def motion_ratio(a: Image.Image, b: Image.Image) -> float:
    # Compare visible RGBA changes after compositing on neutral gray.
    bg_a = Image.new("RGBA", a.size, (127, 127, 127, 255))
    bg_b = bg_a.copy()
    bg_a.alpha_composite(a)
    bg_b.alpha_composite(b)
    diff = ImageChops.difference(bg_a.convert("RGB"), bg_b.convert("RGB"))
    mask = diff.convert("L").point(lambda value: 255 if value > 12 else 0)
    pixels = mask.get_flattened_data() if hasattr(mask, "get_flattened_data") else mask.getdata()
    changed = sum(1 for value in pixels if value)
    return round(changed / (FRAME_SIZE * FRAME_SIZE), 4)


def save_strip(frames: list[Image.Image], output: Path):
    strip = Image.new("RGBA", (FRAME_SIZE * 6, FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME_SIZE, 0))
    strip.save(output, "WEBP", lossless=True, method=6)


def save_animated_webp(frames: list[Image.Image], output: Path):
    """Write the six distinct poses as a browser-native transparent animation."""
    frames[0].save(
        output,
        "WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=[430, 180, 180, 300, 180, 430],
        loop=0,
        lossless=True,
        method=6,
    )


def save_preview(frames: list[Image.Image], output: Path):
    preview = []
    for frame in frames:
        canvas = Image.new("RGBA", frame.size, (246, 244, 255, 255))
        canvas.alpha_composite(frame)
        preview.append(canvas.convert("RGB"))
    preview[0].save(
        output,
        save_all=True,
        append_images=preview[1:],
        duration=[430, 180, 180, 300, 180, 430],
        loop=0,
        optimize=True,
    )


def build_contact_sheet(pet: str, rows: list[tuple[str, list[Image.Image]]], output: Path):
    label_height = 34
    sheet = Image.new("RGB", (FRAME_SIZE * 6, (FRAME_SIZE + label_height) * 2), (241, 238, 252))
    draw = ImageDraw.Draw(sheet)
    for row_index, (action, frames) in enumerate(rows):
        top = row_index * (FRAME_SIZE + label_height)
        draw.text((12, top + 8), f"{pet} / {action} / six real frames", fill=(43, 31, 87))
        for frame_index, frame in enumerate(frames):
            cell = Image.new("RGBA", frame.size, (246, 244, 255, 255))
            cell.alpha_composite(frame)
            sheet.paste(cell.convert("RGB"), (frame_index * FRAME_SIZE, top + label_height))
    sheet.save(output, "PNG", optimize=True)


def build_master_contact_sheet(qa_dir: Path):
    cards = []
    card_width = 768
    for pet in ACTIONS:
        source = Image.open(qa_dir / f"{pet}-contact-sheet.png").convert("RGB")
        height = round(source.height * card_width / source.width)
        cards.append(source.resize((card_width, height), Image.Resampling.LANCZOS))
    card_height = cards[0].height
    sheet = Image.new("RGB", (card_width * 2, card_height * 5), (235, 231, 249))
    for index, card in enumerate(cards):
        sheet.paste(card, ((index % 2) * card_width, (index // 2) * card_height))
    sheet.save(qa_dir / "all-pets-animation-contact-sheet.jpg", "JPEG", quality=90, optimize=True)


def checkerboard_cell() -> Image.Image:
    cell = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (249, 248, 253, 255))
    draw = ImageDraw.Draw(cell)
    tile = 16
    for y in range(0, FRAME_SIZE, tile):
        for x in range(0, FRAME_SIZE, tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(229, 225, 240, 255))
    return cell


def build_priority_edge_sheet(output_dir: Path, qa_dir: Path):
    """Make a focused sheet for the widest wings and the requested tails."""
    label_height = 34
    sheet = Image.new(
        "RGB",
        (FRAME_SIZE * 6, (FRAME_SIZE + label_height) * len(PRIORITY_EDGE_CHECKS)),
        (235, 231, 249),
    )
    draw = ImageDraw.Draw(sheet)
    checks = []
    for row_index, (pet, action, label) in enumerate(PRIORITY_EDGE_CHECKS):
        top = row_index * (FRAME_SIZE + label_height)
        draw.text((12, top + 8), f"{label} / 18px red safety line / green alpha bounds", fill=(43, 31, 87))
        strip = Image.open(output_dir / f"{pet}-{action}.webp").convert("RGBA")
        for frame_index in range(6):
            frame = strip.crop((frame_index * FRAME_SIZE, 0, (frame_index + 1) * FRAME_SIZE, FRAME_SIZE))
            bbox = alpha_bbox(frame)
            margins = edge_margins(frame)
            passed = min(margins) >= PADDING - 2
            cell = checkerboard_cell()
            cell.alpha_composite(frame)
            cell_draw = ImageDraw.Draw(cell)
            cell_draw.rectangle(
                (PADDING - 2, PADDING - 2, FRAME_SIZE - PADDING + 1, FRAME_SIZE - PADDING + 1),
                outline=(244, 80, 132, 255),
                width=2,
            )
            if bbox:
                cell_draw.rectangle((bbox[0], bbox[1], bbox[2] - 1, bbox[3] - 1), outline=(34, 177, 116, 255), width=1)
            cell_draw.text((6, 6), f"F{frame_index + 1} {min(margins)}px", fill=(43, 31, 87, 255))
            sheet.paste(cell.convert("RGB"), (frame_index * FRAME_SIZE, top + label_height))
            checks.append({
                "pet": pet,
                "action": action,
                "frame": frame_index + 1,
                "edge_margins": margins,
                "minimum_edge_margin": min(margins),
                "passed": passed,
            })
    sheet.save(qa_dir / "priority-wings-and-tails-edge-check.png", "PNG", optimize=True)
    summary = {
        "ok": all(item["passed"] for item in checks),
        "sequence_count": len(PRIORITY_EDGE_CHECKS),
        "frame_count": len(checks),
        "minimum_edge_margin": min(item["minimum_edge_margin"] for item in checks),
        "checks": checks,
    }
    (qa_dir / "priority-wings-and-tails-validation.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return summary


def process_sheet(pet: str, source: Path, output_dir: Path, qa_dir: Path):
    source_image = Image.open(source).convert("RGBA")
    pose_rows, pose_reports = extract_pose_groups(source_image)

    actions = ACTIONS[pet]
    rows = []
    report = {"pet": pet, "source": str(source), "source_size": source_image.size, "actions": {}}
    for row_index, action in enumerate(actions):
        frames = normalize_row(pose_rows[row_index])
        ratios = [motion_ratio(frames[index], frames[index + 1]) for index in range(5)]
        # A sequence with almost no changed pixels is the old fake-shake failure.
        if max(ratios) < 0.012:
            raise ValueError(f"{pet}/{action}: visually inert frames {ratios}")
        margins = [edge_margins(frame) for frame in frames]
        if any(min(frame_margins) < PADDING - 2 for frame_margins in margins):
            raise ValueError(f"{pet}/{action}: unsafe final edge margins {margins}")
        save_strip(frames, output_dir / f"{pet}-{action}.webp")
        save_animated_webp(frames, output_dir / f"{pet}-{action}-animated.webp")
        save_preview(frames, qa_dir / f"{pet}-{action}.gif")
        report["actions"][action] = {
            "frame_count": 6,
            "motion_ratios": ratios,
            "max_motion_ratio": max(ratios),
            "edge_margins": margins,
            "source_poses": pose_reports[row_index],
        }
        rows.append((action, frames))
    build_contact_sheet(pet, rows, qa_dir / f"{pet}-contact-sheet.png")
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--qa-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.qa_dir.mkdir(parents=True, exist_ok=True)

    reports = []
    for pet in ACTIONS:
        source = args.source_dir / f"{pet}-alpha.png"
        if not source.exists():
            raise FileNotFoundError(source)
        reports.append(process_sheet(pet, source, args.output_dir, args.qa_dir))

    build_master_contact_sheet(args.qa_dir)
    priority_summary = build_priority_edge_sheet(args.output_dir, args.qa_dir)

    summary = {
        "ok": True,
        "pet_count": len(reports),
        "action_count": sum(len(item["actions"]) for item in reports),
        "frame_count": sum(sum(action["frame_count"] for action in item["actions"].values()) for item in reports),
        "priority_edge_check": {
            "ok": priority_summary["ok"],
            "sequence_count": priority_summary["sequence_count"],
            "frame_count": priority_summary["frame_count"],
            "minimum_edge_margin": priority_summary["minimum_edge_margin"],
        },
        "pets": reports,
    }
    (args.qa_dir / "pet-animation-validation.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({key: summary[key] for key in ("ok", "pet_count", "action_count", "frame_count")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
