"""Professional verification of vets by a platform admin."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Vet

logger = logging.getLogger(__name__)


class AdminVerificationService:
    def __init__(self, db: Session):
        self.db = db

    def list_pending(self) -> tuple[list[Vet], int]:
        condition = Vet.is_verified.is_(False)
        items = list(self.db.scalars(select(Vet).where(condition).order_by(Vet.created_at.asc())))
        total = self.db.scalar(select(func.count(Vet.id)).where(condition)) or 0
        return items, total

    def _get(self, vet_id: UUID) -> Vet:
        vet = self.db.scalar(select(Vet).where(Vet.id == vet_id))
        if vet is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ο κτηνίατρος δεν βρέθηκε.")
        return vet

    def approve(self, vet_id: UUID, admin: Vet) -> Vet:
        vet = self._get(vet_id)
        if not vet.email_verified:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Το email του κτηνιάτρου δεν έχει επαληθευτεί ακόμη.")
        if not vet.is_verified:
            vet.is_verified = True
            self.db.commit()
            self.db.refresh(vet)
            logger.info("Admin %s approved vet %s", admin.id, vet.id)
        return vet

    def revoke(self, vet_id: UUID, admin: Vet) -> Vet:
        vet = self._get(vet_id)
        if vet.id == admin.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Δεν μπορείτε να ανακαλέσετε τη δική σας έγκριση.")
        if vet.is_verified:
            vet.is_verified = False
            self.db.commit()
            self.db.refresh(vet)
            logger.info("Admin %s revoked vet %s", admin.id, vet.id)
        return vet

    def reject(self, vet_id: UUID, admin: Vet) -> None:
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
