"""
Shared validation for uploaded images.

The client-supplied content type and filename are never trusted: the type is
decided from magic bytes, the image must decode with Pillow, and it is
re-encoded so EXIF/GPS metadata and any trailing payload are dropped.
"""

import io
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
# Multipart framing (boundaries, headers) on top of the file itself.
MULTIPART_OVERHEAD_BYTES = 64 * 1024
# Decompression-bomb guard: a small file can declare a huge canvas.
MAX_IMAGE_PIXELS = 36_000_000
_CHUNK = 64 * 1024

MSG_UNSUPPORTED = "Μη αποδεκτός τύπος αρχείου. Επιτρέπονται μόνο εικόνες JPG, PNG και WebP."
MSG_CORRUPT = "Το αρχείο δεν είναι έγκυρη εικόνα."


def too_large_message(max_bytes: int = MAX_UPLOAD_BYTES) -> str:
    return f"Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: {max_bytes // (1024 * 1024)}MB."


def too_large_error(max_bytes: int = MAX_UPLOAD_BYTES) -> HTTPException:
    return HTTPException(
        status_code=413,
        detail=too_large_message(max_bytes),
    )


def declared_length_too_large(content_length: Optional[str], max_bytes: int = MAX_UPLOAD_BYTES) -> bool:
    """True when a Content-Length header already proves the body exceeds the cap."""
    try:
        return content_length is not None and int(content_length) > max_bytes + MULTIPART_OVERHEAD_BYTES
    except ValueError:
        return False


def detect_image_type(head: bytes) -> Optional[str]:
    """Return 'jpeg', 'png' or 'webp' from the leading bytes, or None."""
    if head[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


async def read_limited(file: UploadFile, max_bytes: int = MAX_UPLOAD_BYTES) -> bytes:
    """Read the upload in chunks, aborting as soon as the cap is exceeded."""
    buffer = bytearray()
    while True:
        chunk = await file.read(_CHUNK)
        if not chunk:
            break
        buffer.extend(chunk)
        if len(buffer) > max_bytes:
            raise too_large_error(max_bytes)
    return bytes(buffer)


def sanitize_image(data: bytes) -> tuple[bytes, str]:
    """Validate and re-encode an image. Returns (clean bytes, extension).

    JPEG stays .jpg, PNG stays .png; WebP becomes .png when it has transparency
    and .jpg otherwise, which keeps stored URLs within the extensions the
    profile schemas accept.
    """
    kind = detect_image_type(data[:16])
    if kind is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=MSG_UNSUPPORTED)

    try:
        with Image.open(io.BytesIO(data)) as img:
            if img.format.lower() != kind:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=MSG_UNSUPPORTED)
            if img.width * img.height > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Η εικόνα έχει υπερβολικά μεγάλες διαστάσεις.",
                )
            img.load()
            img = ImageOps.exif_transpose(img)

            has_alpha = img.mode in ("RGBA", "LA") or (
                img.mode == "P" and "transparency" in img.info
            )
            out = io.BytesIO()
            if kind == "png" or (kind == "webp" and has_alpha):
                if img.mode not in ("RGB", "RGBA", "L", "LA", "P"):
                    img = img.convert("RGBA" if has_alpha else "RGB")
                img.save(out, format="PNG", optimize=True)
                ext = ".png"
            else:
                img.convert("RGB").save(out, format="JPEG", quality=90, optimize=True)
                ext = ".jpg"
    except HTTPException:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Η εικόνα έχει υπερβολικά μεγάλες διαστάσεις.",
        ) from None
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=MSG_CORRUPT) from None

    return out.getvalue(), ext
