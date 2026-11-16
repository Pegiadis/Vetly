"""Version of the terms/privacy text accepted at registration, defined once for every sign-up path."""
from datetime import datetime

from fastapi import HTTPException, status

TERMS_VERSION = "2026-11-10-draft"

TERMS_REQUIRED_MESSAGE = "Πρέπει να αποδεχτείτε τους Όρους Χρήσης και την Πολιτική Απορρήτου για να δημιουργήσετε λογαριασμό."


def consent_fields(accept_terms: bool, *, required: bool = True) -> dict:
    """Column values recording consent. Raises 400 when consent is required but not given.

    `required=False` is only for the mobile app, whose register screen does not show the
    terms yet: its accounts are stored without consent (NULL) instead of a false record.
    """
    if accept_terms:
        return {"terms_accepted_at": datetime.utcnow(), "terms_version": TERMS_VERSION}
    if required:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, TERMS_REQUIRED_MESSAGE)
    return {}
