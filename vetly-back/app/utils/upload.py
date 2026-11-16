"""
File upload utilities for local photo storage
"""

import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.uploads import MAX_UPLOAD_BYTES, read_limited, sanitize_image

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

# Subdirectories uploads may be written to; the prefix is never client-controlled.
ALLOWED_PREFIXES = {"vet", "owner", "pet", "pet_cover"}


def ensure_upload_dir() -> None:
    """Create the upload directory if it doesn't exist."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_upload(file: UploadFile, prefix: str, max_size_bytes: int = MAX_UPLOAD_BYTES) -> str:
    """
    Validate, sanitise and save an uploaded image.

    The size is capped while reading, the type comes from the file's magic
    bytes, and the stored name is server-generated (uuid + detected extension).
    Returns the relative URL path (e.g. '/uploads/vet/abc123.jpg').
    """
    if prefix not in ALLOWED_PREFIXES:
        raise ValueError(f"Unknown upload prefix: {prefix}")

    raw = await read_limited(file, max_size_bytes)
    contents, ext = sanitize_image(raw)

    subdir = UPLOAD_DIR / prefix
    subdir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = subdir / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{prefix}/{filename}"


def delete_upload(url: str | None) -> None:
    """Delete a previously uploaded file by its URL path.

    Defense in depth: even if a malicious value somehow lands in an image_url
    column (e.g. via an unvalidated update endpoint), the resolved filesystem
    path must still live under UPLOAD_DIR or this function silently no-ops.
    """
    if not url or not url.startswith("/uploads/"):
        return
    relative = url.split("/uploads/", 1)[-1]
    upload_root = UPLOAD_DIR.resolve()
    filepath = (upload_root / relative).resolve()
    if not filepath.is_relative_to(upload_root):
        return
    if filepath.exists():
        filepath.unlink()
