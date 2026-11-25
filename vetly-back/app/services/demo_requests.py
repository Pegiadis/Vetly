"""Demo requests: the public form on the vets page and the admin list."""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core import email as email_module
from app.core.config import settings
from app.core.email_templates import demo_request_received_email, demo_request_team_email
from app.db.base import DemoRequest
from app.schemas.demo_request import DemoRequestCreate

logger = logging.getLogger(__name__)


class DemoRequestService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: DemoRequestCreate) -> None:
        if data.website:
            # Honeypot filled in: a bot. Answer as usual so it learns nothing, store nothing.
            logger.info("Dropped a demo request that filled the honeypot field")
            return
        request = DemoRequest(
            name=data.name, clinic_name=data.clinic_name, email=str(data.email).lower(),
            phone=data.phone, city=data.city, message=data.message or None,
        )
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        logger.info("New demo request %s", request.id)
        self._notify(request)

    @staticmethod
    def _notify(request: DemoRequest) -> None:
        """The request is already saved, so a mail failure must not fail the form."""
        base = settings.FRONTEND_URL.rstrip("/")
        if settings.DEMO_REQUEST_EMAIL:
            try:
                subject, html = demo_request_team_email(
                    request.name, request.clinic_name, request.email, request.phone, request.city,
                    request.message or "", f"{base}/admin/demo-requests",
                )
                email_module.send_email(settings.DEMO_REQUEST_EMAIL, subject, html)
            except Exception:
                logger.exception("Could not email the team about demo request %s", request.id)
        try:
            subject, html = demo_request_received_email(request.name)
            email_module.send_email(request.email, subject, html)
        except Exception:
            logger.exception("Could not confirm demo request %s to the clinic", request.id)

    # --- admin ---

    def list(self, status_filter: str | None, q: str | None, page: int, page_size: int):
        conditions = []
        if status_filter:
            conditions.append(DemoRequest.status == status_filter)
        if q and q.strip():
            pattern = f"%{q.strip()}%"
            conditions.append(or_(*(column.ilike(pattern) for column in (
                DemoRequest.name, DemoRequest.clinic_name, DemoRequest.email, DemoRequest.phone, DemoRequest.city))))
        total = self.db.scalar(select(func.count(DemoRequest.id)).where(*conditions)) or 0
        items = list(self.db.scalars(
            select(DemoRequest).where(*conditions).order_by(DemoRequest.created_at.desc())
            .offset((page - 1) * page_size).limit(page_size)
        ))
        return items, total

    def get(self, request_id: UUID) -> DemoRequest:
        request = self.db.get(DemoRequest, request_id)
        if request is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Το αίτημα δεν βρέθηκε.")
        return request

    def set_status(self, request_id: UUID, new_status: str) -> DemoRequest:
        request = self.get(request_id)
        if new_status == "converted" and request.vet_id is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Δημιουργήστε πρώτα τον λογαριασμό του κτηνιάτρου.")
        request.status = new_status
        self.db.commit()
        self.db.refresh(request)
        return request
