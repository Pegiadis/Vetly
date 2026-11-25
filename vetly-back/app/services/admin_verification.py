"""Professional verification of vets by a platform admin."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core import email as email_module
from app.core.email_templates import vet_account_approved_email
from app.db.base import Admin, Vet

logger = logging.getLogger(__name__)


class AdminVerificationService:
    def __init__(self, db: Session):
        self.db = db

    def _get(self, vet_id: UUID) -> Vet:
        vet = self.db.scalar(select(Vet).where(Vet.id == vet_id))
        if vet is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ο κτηνίατρος δεν βρέθηκε.")
        return vet

    def approve(self, vet_id: UUID, admin: Admin) -> Vet:
        vet = self._get(vet_id)
        if not vet.email_verified:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Το email του κτηνιάτρου δεν έχει επαληθευτεί ακόμη.")
        if not vet.is_verified:
            vet.is_verified = True
            self.db.commit()
            self.db.refresh(vet)
            logger.info("Admin %s approved vet %s", admin.id, vet.id)
            self._send_approved_email(vet)
        return vet

    @staticmethod
    def _send_approved_email(vet: Vet) -> None:
        """The approval is already committed, so a mail failure must not undo or fail it."""
        try:
            login_url = f"{settings.FRONTEND_URL.rstrip('/')}/vet/login"
            subject, html = vet_account_approved_email(vet.name, login_url)
            email_module.send_email(vet.email, subject, html)
        except Exception:
            logger.exception("Could not send approval email to vet %s", vet.id)

    def revoke(self, vet_id: UUID, admin: Admin) -> Vet:
        vet = self._get(vet_id)
        if vet.is_verified:
            vet.is_verified = False
            self.db.commit()
            self.db.refresh(vet)
            logger.info("Admin %s revoked vet %s", admin.id, vet.id)
        return vet

    def reject(self, vet_id: UUID, admin: Admin) -> None:
        """Deletes a registration that was never approved, which frees its email and licence number."""
        vet = self._get(vet_id)
        if vet.is_verified:
            raise HTTPException(status.HTTP_409_CONFLICT, "Ο κτηνίατρος είναι εγκεκριμένος. Χρησιμοποιήστε ανάκληση.")
        try:
            self.db.delete(vet)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, "Η εγγραφή έχει συσχετισμένα δεδομένα και δεν μπορεί να διαγραφεί.")
        logger.info("Admin %s rejected vet registration %s", admin.id, vet_id)
