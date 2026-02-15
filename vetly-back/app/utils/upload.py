"""
File upload utilities for local photo storage
"""

import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException, status

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
}

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def ensure_upload_dir() -> None:
    """Create the upload directory if it doesn't exist."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_upload(file: UploadFile, prefix: str, max_size_bytes: int) -> str:
    """
    Validate and save an uploaded file.

    Returns the relative URL path (e.g. '/uploads/vet_abc123.jpg').
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Μη αποδεκτός τύπος αρχείου. Επιτρέπονται μόνο JPG και PNG.",
        )

    ext = ALLOWED_CONTENT_TYPES[file.content_type]

    contents = await file.read()
    if len(contents) > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        actual_mb = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Το αρχείο είναι πολύ μεγάλο ({actual_mb:.1f}MB). Μέγιστο μέγεθος: {max_mb:.0f}MB.",
        )

    subdir = UPLOAD_DIR / prefix
    subdir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = subdir / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{prefix}/{filename}"


def delete_upload(url: str | None) -> None:
    """Delete a previously uploaded file by its URL path."""
    if not url or not url.startswith("/uploads/"):
        return
    relative = url.split("/uploads/", 1)[-1]
    filepath = UPLOAD_DIR / relative
    if filepath.exists():
        filepath.unlink()
