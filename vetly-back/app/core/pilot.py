"""Closed-pilot access is checked on every authenticated request, not only signup."""
from fastapi import HTTPException
from app.core.config import settings


def require_pilot_access(email: str) -> None:
    if settings.PILOT_MODE and email.strip().casefold() not in {
        item.strip().casefold() for item in settings.PILOT_ALLOWED_EMAILS
    }:
        raise HTTPException(403, "Η κλειστή πιλοτική δοκιμή είναι διαθέσιμη μόνο με πρόσκληση.")
