"""NIIMBOT label generation for print requests (internal API)."""

import io
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from spoolman.database import print_request as print_request_db
from spoolman.database.database import get_db_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/print-request", tags=["print-request"])

# Label dimensions for NIIMBOT B1 Pro: 50mm x 30mm
LABEL_WIDTH_MM = 50
LABEL_HEIGHT_MM = 30
LABEL_DPI = 300  # NIIMBOT B1 Pro supports 300 DPI
LABEL_WIDTH_PX = int(LABEL_WIDTH_MM / 25.4 * LABEL_DPI)  # ~591px
LABEL_HEIGHT_PX = int(LABEL_HEIGHT_MM / 25.4 * LABEL_DPI)  # ~354px

# Layout constants
PADDING = 12
QR_SIZE = LABEL_WIDTH_PX // 2 - PADDING  # QR code takes half the label width
TEXT_AREA_WIDTH = LABEL_WIDTH_PX // 2  # Text area is the other half

# Font sizes scaled for 300 DPI
FONT_SIZE_LARGE = 30
FONT_SIZE_MEDIUM = 26
FONT_SIZE_SMALL = 22
FONT_SIZE_LABEL = 16


def _format_price(value: Optional[float], currency: Optional[str] = None) -> str:
    """Format a price value for the label."""
    if value is None or value == 0:
        return "Kostenlos"
    curr = currency or "EUR"
    return f"{value:.2f} {curr}"


def _format_date(value: Optional[datetime]) -> str:
    """Format a datetime for the label."""
    if value is None:
        return "—"
    return value.strftime("%d.%m.%Y")


def _truncate_text(text: str, max_chars: int) -> str:
    """Truncate text with ellipsis if too long."""
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1] + "…"


def _wrap_title(title: str, max_width: int, font, draw) -> list[str]:
    """Wrap title text into lines, breaking only at spaces or hyphens.

    If a single word exceeds the max width, a hyphen is inserted to force a break.
    Returns up to 4 lines. If the text still doesn't fit, the last line is truncated with ellipsis.
    """
    max_lines = 5
    words = []
    # Split by spaces, preserving hyphens as break points
    for part in title.split(" "):
        if not part:
            continue
        # Split at hyphens but keep the hyphen attached to the left word
        hyphen_parts = part.split("-")
        for i, hp in enumerate(hyphen_parts):
            if i < len(hyphen_parts) - 1:
                words.append(hp + "-")
            else:
                words.append(hp)

    def _force_break_word(word: str) -> list[str]:
        """Break a word that is too wide by inserting hyphens."""
        fragments = []
        remaining = word
        while remaining:
            # Find the longest prefix that fits with a trailing hyphen
            for end in range(len(remaining), 0, -1):
                chunk = remaining[:end]
                suffix = "-" if end < len(remaining) else ""
                bbox = draw.textbbox((0, 0), chunk + suffix, font=font)
                if bbox[2] - bbox[0] <= max_width:
                    fragments.append(chunk + suffix)
                    remaining = remaining[end:]
                    break
            else:
                # Even a single char doesn't fit, force it anyway
                fragments.append(remaining[0])
                remaining = remaining[1:]
        return fragments

    lines: list[str] = []
    current_line = ""

    for word in words:
        if not word:
            continue
        test_line = f"{current_line} {word}".strip() if current_line else word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        text_width = bbox[2] - bbox[0]

        if text_width <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
                if len(lines) >= max_lines:
                    break
                current_line = ""

            # Check if the word itself fits on a new line
            bbox = draw.textbbox((0, 0), word, font=font)
            if bbox[2] - bbox[0] <= max_width:
                current_line = word
            else:
                # Word too long: force break with hyphens
                fragments = _force_break_word(word)
                for frag in fragments:
                    if len(lines) >= max_lines:
                        break
                    if not current_line:
                        current_line = frag
                    else:
                        test = f"{current_line} {frag}".strip()
                        bbox = draw.textbbox((0, 0), test, font=font)
                        if bbox[2] - bbox[0] <= max_width:
                            current_line = test
                        else:
                            lines.append(current_line)
                            current_line = frag

        if len(lines) >= max_lines:
            break

    if current_line and len(lines) < max_lines:
        lines.append(current_line)

    # If we still have overflow, truncate the last line
    if len(lines) >= max_lines:
        last = lines[max_lines - 1]
        bbox = draw.textbbox((0, 0), last, font=font)
        if bbox[2] - bbox[0] > max_width:
            while len(last) > 1:
                last = last[:-1]
                test = last + "…"
                bbox = draw.textbbox((0, 0), test, font=font)
                if bbox[2] - bbox[0] <= max_width:
                    lines[max_lines - 1] = test
                    break
        lines = lines[:max_lines]

    return lines if lines else [title[:10] + "…"]


def _generate_label_png(
    *,
    request_id: int,
    title: str,
    price: Optional[float],
    currency: Optional[str],
    created_at: Optional[datetime],
    completed_at: Optional[datetime],
    public_url: str,
) -> bytes:
    """Generate a NIIMBOT B1 Pro label as PNG bytes.

    Layout:
    - Left side: Request-ID, title, order date, completion date, price (bottom)
    - Right side: QR code linking to the public request URL
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pillow is not installed on the server.",
        ) from exc

    try:
        import qrcode
        from qrcode.image.pil import PilImage
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="qrcode library is not installed on the server.",
        ) from exc

    # Create white background image
    img = Image.new("1", (LABEL_WIDTH_PX, LABEL_HEIGHT_PX), color=1)  # 1-bit, white
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        font_large = ImageFont.truetype("DejaVuSans-Bold.ttf", FONT_SIZE_LARGE)
        font_medium = ImageFont.truetype("DejaVuSans.ttf", FONT_SIZE_MEDIUM)
        font_small = ImageFont.truetype("DejaVuSans.ttf", FONT_SIZE_SMALL)
        font_label = ImageFont.truetype("DejaVuSans.ttf", FONT_SIZE_LABEL)
    except (OSError, IOError):
        # Fallback: try common system font paths
        font_paths_bold = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf",
        ]
        font_paths_regular = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/TTF/DejaVuSans.ttf",
            "C:\\Windows\\Fonts\\arial.ttf",
        ]
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_label = ImageFont.load_default()

        for path in font_paths_bold:
            try:
                font_large = ImageFont.truetype(path, FONT_SIZE_LARGE)
                break
            except (OSError, IOError):
                continue

        for path in font_paths_regular:
            try:
                font_medium = ImageFont.truetype(path, FONT_SIZE_MEDIUM)
                font_small = ImageFont.truetype(path, FONT_SIZE_SMALL)
                font_label = ImageFont.truetype(path, FONT_SIZE_LABEL)
                break
            except (OSError, IOError):
                continue

    # Generate QR code
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(public_url)
    qr.make(fit=True)
    qr_img: PilImage = qr.make_image(fill_color="black", back_color="white")
    qr_img = qr_img.resize((QR_SIZE, QR_SIZE), Image.NEAREST)

    # Place QR code on the right half, centered vertically
    qr_x = LABEL_WIDTH_PX // 2 + PADDING // 2
    qr_y = (LABEL_HEIGHT_PX - QR_SIZE) // 2
    img.paste(qr_img.convert("1"), (qr_x, qr_y))

    # Draw text on the left half
    text_x = PADDING
    text_max_width = LABEL_WIDTH_PX // 2 - (2 * PADDING)
    y_cursor = PADDING

    # Request ID (prominent)
    id_text = f"#{request_id}"
    draw.text((text_x, y_cursor), id_text, font=font_large, fill=0)
    y_cursor += FONT_SIZE_LARGE + 8

    # Separator line (half label width including padding)
    line_end_x = LABEL_WIDTH_PX // 2
    draw.line([(text_x, y_cursor), (line_end_x, y_cursor)], fill=0, width=2)
    y_cursor += 8

    # Title (variable 1-4 lines, word-wrap at spaces/hyphens)
    title_lines = _wrap_title(title, text_max_width, font_small, draw)
    for line in title_lines:
        draw.text((text_x, y_cursor), line, font=font_small, fill=0)
        y_cursor += FONT_SIZE_SMALL + 3

    y_cursor = LABEL_HEIGHT_PX / 2 + 20

    # Order date (Bestelldatum)
    draw.text((text_x, y_cursor), "Bestelldatum", font=font_label, fill=0)
    y_cursor += FONT_SIZE_LABEL + 2
    draw.text((text_x, y_cursor), _format_date(created_at), font=font_small, fill=0)
    y_cursor += FONT_SIZE_SMALL + 8

    # Completion date (Fertigstellung)
    draw.text((text_x, y_cursor), "Fertigstellung", font=font_label, fill=0)
    y_cursor += FONT_SIZE_LABEL + 2
    draw.text((text_x, y_cursor), _format_date(completed_at), font=font_small, fill=0)
    y_cursor += FONT_SIZE_SMALL + 15

    # Price (at the bottom)
    draw.text((text_x, y_cursor), "Preis", font=font_label, fill=0)
    y_cursor += FONT_SIZE_LABEL + 2
    price_text = _format_price(price, currency)
    draw.text((text_x, y_cursor), price_text, font=font_medium, fill=0)

    # Convert to PNG bytes
    buffer = io.BytesIO()
    # Convert 1-bit to grayscale for better PNG compatibility
    img_out = img.convert("L")
    img_out.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return buffer.getvalue()


@router.get(
    "/{request_id}/label",
    summary="Generate NIIMBOT label",
    description=(
        "Generates a 50x30mm black-and-white PNG label for NIIMBOT B1 Pro printers. "
        "The label contains the request ID, title, price, completion date, and a QR code "
        "linking to the public request URL."
    ),
    responses={
        200: {"content": {"image/png": {}}, "description": "Label PNG image"},
        404: {"description": "Print request not found"},
    },
)
async def generate_label(
    request_id: int,
    base_url: Optional[str] = Query(
        default=None,
        description="Base URL for the QR code. Falls back to a default public URL pattern.",
    ),
    db: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    """Generate a NIIMBOT B1 Pro label PNG for a print request."""
    # Load print request by internal ID
    obj = await print_request_db.get_print_request(db, request_id)

    # Build the public URL for the QR code
    if base_url:
        public_url = f"{base_url.rstrip('/')}/request/status/{obj.public_id}"
    else:
        # Default: use canoob.de as configured in the show page
        public_url = f"https://canoob.de/request/status/{obj.public_id}"

    # Determine price from cost calculation
    price = None
    currency = None
    if obj.cost_calculation:
        price = obj.cost_calculation.final_price
        currency = obj.cost_calculation.currency

    # Generate label
    png_bytes = _generate_label_png(
        request_id=obj.id,
        title=obj.title,
        price=price,
        currency=currency,
        created_at=obj.created_at,
        completed_at=obj.completed_at,
        public_url=public_url,
    )

    filename = f"request-{obj.id}-label.png"

    return StreamingResponse(
        io.BytesIO(png_bytes),
        media_type="image/png",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(png_bytes)),
        },
    )
