"""
Purpose: Generate the temporary favicon and Open Graph image assets used by
the Raleigh Premium Wellness site.
Role: Creates clean, repeatable share-surface assets from code so metadata
does not depend on ad hoc design exports.
Dependencies: Python 3 with Pillow installed.
Risk: These assets appear in browser tabs and social previews, so visual
changes should stay restrained and on-brief.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIRECTORY = REPOSITORY_ROOT / "assets" / "share-surfaces"
FAVICON_PNG_PATH = OUTPUT_DIRECTORY / "favicon-64.png"
FAVICON_ICO_PATH = OUTPUT_DIRECTORY / "favicon.ico"
FAVICON_SVG_PATH = OUTPUT_DIRECTORY / "favicon.svg"
OG_IMAGE_PATH = OUTPUT_DIRECTORY / "open-graph-preview-1200x630.png"

BACKGROUND_COLOR = "#171311"
TEXT_COLOR = "#f6efe7"
SUBLINE_COLOR = "#cfb28f"


def load_font(font_name: str, font_size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(font_name, font_size)
    except OSError:
        return ImageFont.load_default()


def generate_favicon_assets() -> None:
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)

    image = Image.new("RGBA", (64, 64), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(image)
    font = load_font("Georgia Bold.ttf", 38)
    glyph = "R"
    text_box = draw.textbbox((0, 0), glyph, font=font)
    text_width = text_box[2] - text_box[0]
    text_height = text_box[3] - text_box[1]
    text_x = (64 - text_width) / 2
    text_y = (64 - text_height) / 2 - 2
    draw.text((text_x, text_y), glyph, fill=TEXT_COLOR, font=font)

    image.save(FAVICON_PNG_PATH)
    image.save(FAVICON_ICO_PATH, sizes=[(64, 64), (32, 32), (16, 16)])

    FAVICON_SVG_PATH.write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
  <rect width="64" height="64" rx="14" fill="#171311" />
  <text x="50%" y="56%" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="38" font-weight="700" fill="#f6efe7">R</text>
</svg>
""",
        encoding="utf8",
    )


def generate_open_graph_image() -> None:
    image = Image.new("RGB", (1200, 630), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(image)

    headline_font = load_font("Georgia Bold.ttf", 92)
    subline_font = load_font("Helvetica.ttc", 34)

    draw.rectangle((72, 72, 1128, 558), outline="#2d2420", width=1)

    subline = "A new premium wellness experience"
    headline = "Coming to Raleigh"

    subline_box = draw.textbbox((0, 0), subline, font=subline_font)
    subline_width = subline_box[2] - subline_box[0]
    headline_box = draw.textbbox((0, 0), headline, font=headline_font)
    headline_width = headline_box[2] - headline_box[0]

    draw.text(((1200 - subline_width) / 2, 215), subline, fill=SUBLINE_COLOR, font=subline_font)
    draw.text(((1200 - headline_width) / 2, 270), headline, fill=TEXT_COLOR, font=headline_font)

    image.save(OG_IMAGE_PATH, quality=95)


if __name__ == "__main__":
    generate_favicon_assets()
    generate_open_graph_image()
    print(f"Generated share-surface assets in {OUTPUT_DIRECTORY}")
