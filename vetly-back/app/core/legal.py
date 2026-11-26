"""Version of the terms/privacy text accepted at registration, defined once for every sign-up path."""
from datetime import datetime

from fastapi import HTTPException, status

TERMS_VERSION = "2026-11-26"

TERMS_REQUIRED_MESSAGE = "Πρέπει να αποδεχτείτε τους Όρους Χρήσης και την Πολιτική Απορρήτου για να δημιουργήσετε λογαριασμό."


def consent_fields(accept_terms: bool) -> dict:
    """Column values recording consent. Raises 400 when consent is not given (web and mobile alike)."""
    if not accept_terms:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, TERMS_REQUIRED_MESSAGE)
    return {"terms_accepted_at": datetime.utcnow(), "terms_version": TERMS_VERSION}
