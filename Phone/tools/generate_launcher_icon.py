from __future__ import annotations

from pathlib import Path
from typing import Dict

from PIL import Image, ImageDraw

OUTPUT_BASE = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "res"

SOURCE_ART = Path(__file__).resolve().parents[2] / "69f759be-2735-4910-97bd-88d22b0a5a75.png"

DENSITIES: Dict[str, float] = {
    "mdpi": 1.0,
    "hdpi": 1.5,
    "xhdpi": 2.0,
    "xxhdpi": 3.0,
    "xxxhdpi": 4.0,
}

def create_icon() -> Image.Image:
    if not SOURCE_ART.exists():
        raise FileNotFoundError(f"Brand artwork not found at {SOURCE_ART}")

    base_size = 1024
    source = Image.open(SOURCE_ART).convert("RGBA")

    # Ensure square canvas and upscale to launcher resolution
    if source.width != source.height:
        min_side = min(source.width, source.height)
        left = (source.width - min_side) // 2
        top = (source.height - min_side) // 2
        source = source.crop((left, top, left + min_side, top + min_side))

    icon = source.resize((base_size, base_size), Image.LANCZOS)

    # Apply gentle vignette to improve contrast on rounded icons
    return icon


def export_assets(icon: Image.Image) -> None:
    foreground_dir = OUTPUT_BASE / "mipmap-anydpi-v26"
    foreground_dir.mkdir(parents=True, exist_ok=True)

    for density, multiplier in DENSITIES.items():
        size = int(round(108 * multiplier))
        resized = icon.resize((size, size), Image.LANCZOS)
        target = OUTPUT_BASE / f"mipmap-{density}" / "ic_launcher_foreground.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        resized.save(target, format="PNG")

        # generate round icon variant
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((0, 0, size, size), fill=255)
        rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        rounded.paste(resized, (0, 0), mask=mask)
        round_target = OUTPUT_BASE / f"mipmap-{density}" / "ic_launcher_round.png"
        rounded.save(round_target, format="PNG")

    # Save high-res source in drawable for reference/debugging
    source_path = OUTPUT_BASE / "drawable" / "bashbosh_launcher_source.png"
    source_path.parent.mkdir(parents=True, exist_ok=True)
    icon.save(source_path, format="PNG")


if __name__ == "__main__":
    icon_image = create_icon()
    export_assets(icon_image)
    print("Launcher icon assets generated.")
