"""Platform administrators are signed-in vets whose email is listed in ADMIN_EMAILS."""
from fastapi import Depends, HTTPException, status

from app.core.config import settings
from app.core.deps import get_current_vet
from app.db.base import Vet


def admin_emails() -> set[str]:
    """Comma-separated, case-insensitive; empty means nobody is admin."""
    return {item.strip().casefold() for item in settings.ADMIN_EMAILS.split(",") if item.strip()}


def is_admin_email(email: str) -> bool:
    return email.strip().casefold() in admin_emails()


def get_current_admin(vet: Vet = Depends(get_current_vet)) -> Vet:
    """get_current_vet already guarantees a verified vet with a confirmed email."""
    if not is_admin_email(vet.email):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Δεν έχετε πρόσβαση σε αυτή την ενέργεια.")
    return vet
