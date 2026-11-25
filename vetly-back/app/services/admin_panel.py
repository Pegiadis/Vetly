"""Read-only views and account actions for the admin panel.

The panel sees accounts and counts, never pets, medical records or messages.
"""
import logging
from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, and_, case, func, or_, select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.appointment import AppointmentStatus
from app.db.base import Admin, Appointment, Pet, PetOwner, Vet, VetClient
from app.schemas.admin import (
    AdminOverview, AdminOwnerItem, AdminVetItem, AppointmentCounts, OwnerCounts, VetCounts, WeekRow,
)
from app.services.scheduling import ATHENS

logger = logging.getLogger(__name__)

ADMIN_SESSION = timedelta(hours=8)
WEEKS_SHOWN = 8

_DUMMY: str | None = None


def _dummy_hash() -> str:
    """A login for an unknown email still checks a hash, so it takes as long as a wrong password."""
    global _DUMMY
    if _DUMMY is None:
        _DUMMY = get_password_hash("not-an-admin-password")
    return _DUMMY


def _search(term: str | None, *columns):
    if not term or not term.strip():
        return None
    pattern = f"%{term.strip()}%"
    return or_(*(column.ilike(pattern) for column in columns))


def _vet_status(vet: Vet) -> str:
    if vet.deactivated_at is not None:
        return "closed"
    return "approved" if vet.is_verified else "pending"


def _owner_status(owner: PetOwner) -> str:
    if owner.suspended_at is not None:
        return "suspended"
    return "active" if owner.email_verified else "unverified"


VET_STATUS_FILTERS = {
    "pending": and_(Vet.is_verified.is_(False), Vet.deactivated_at.is_(None)),
    "approved": and_(Vet.is_verified.is_(True), Vet.deactivated_at.is_(None)),
    "closed": Vet.deactivated_at.is_not(None),
}

# Clinic-only client records have no email or password: they are not accounts.
OWNER_ACCOUNT = and_(PetOwner.email.is_not(None), PetOwner.password_hash.is_not(None))
OWNER_STATUS_FILTERS = {
    "active": and_(PetOwner.suspended_at.is_(None), PetOwner.email_verified.is_(True)),
    "unverified": and_(PetOwner.suspended_at.is_(None), PetOwner.email_verified.is_(False)),
    "suspended": PetOwner.suspended_at.is_not(None),
}


class AdminPanelService:
    def __init__(self, db: Session):
        self.db = db

    # --- sign-in ---

    def login(self, email: str, password: str) -> str:
        admin = self.db.scalar(select(Admin).where(func.lower(Admin.email) == email.strip().casefold()))
        password_ok = verify_password(password, admin.password_hash if admin else _dummy_hash())
        if admin is None or not password_ok:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, "Invalid email or password", headers={"WWW-Authenticate": "Bearer"},
            )
        admin.last_login_at = datetime.utcnow()
        self.db.commit()
        logger.info("Admin %s signed in", admin.id)
        return create_access_token(str(admin.id), token_type="admin", expires_delta=ADMIN_SESSION, version=admin.auth_version)

    # --- overview ---

    def overview(self, today: date | None = None) -> AdminOverview:
        count = lambda stmt: self.db.scalar(stmt) or 0  # noqa: E731
        vets = VetCounts(**{key: count(select(func.count(Vet.id)).where(cond)) for key, cond in VET_STATUS_FILTERS.items()})
        owners = OwnerCounts(
            total=count(select(func.count(PetOwner.id)).where(OWNER_ACCOUNT)),
            unverified=count(select(func.count(PetOwner.id)).where(OWNER_ACCOUNT, OWNER_STATUS_FILTERS["unverified"])),
            suspended=count(select(func.count(PetOwner.id)).where(OWNER_ACCOUNT, OWNER_STATUS_FILTERS["suspended"])),
        )
        now = datetime.utcnow()
        local_now = datetime.now(ATHENS).replace(tzinfo=None)
        appointments = AppointmentCounts(
            last_7_days=count(select(func.count(Appointment.id)).where(Appointment.created_at >= now - timedelta(days=7))),
            last_30_days=count(select(func.count(Appointment.id)).where(Appointment.created_at >= now - timedelta(days=30))),
            upcoming=count(select(func.count(Appointment.id)).where(
                Appointment.scheduled_at >= local_now, Appointment.status.in_((AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)))),
        )

        today = today or local_now.date()
        this_monday = today - timedelta(days=today.weekday())
        starts = [this_monday - timedelta(weeks=n) for n in range(WEEKS_SHOWN - 1, -1, -1)]
        since = datetime.combine(starts[0], datetime.min.time())

        def per_week(model, *conditions) -> dict[date, int]:
            week = func.date_trunc("week", model.created_at).label("week")
            rows = self.db.execute(
                select(week, func.count(model.id)).where(model.created_at >= since, *conditions).group_by(week)
            ).all()
            return {row[0].date(): row[1] for row in rows}

        vet_weeks = per_week(Vet)
        owner_weeks = per_week(PetOwner, OWNER_ACCOUNT)
        appointment_weeks = per_week(Appointment)
        weeks = [
            WeekRow(week_start=start, vets=vet_weeks.get(start, 0), owners=owner_weeks.get(start, 0),
                    appointments=appointment_weeks.get(start, 0))
            for start in starts
        ]
        return AdminOverview(vets=vets, owners=owners, appointments=appointments, weeks=weeks)

    # --- lists ---

    def _page(self, stmt: Select, count_stmt: Select, page: int, page_size: int):
        total = self.db.scalar(count_stmt) or 0
        rows = self.db.execute(stmt.offset((page - 1) * page_size).limit(page_size)).all()
        return rows, total

    def list_vets(self, status_filter: str | None, q: str | None, page: int, page_size: int):
        appointments = (select(func.count(Appointment.id)).where(Appointment.vet_id == Vet.id)
                        .correlate(Vet).scalar_subquery())
        clients = select(func.count(VetClient.id)).where(VetClient.vet_id == Vet.id).correlate(Vet).scalar_subquery()
        conditions = [c for c in (VET_STATUS_FILTERS.get(status_filter or ""),
                                  _search(q, Vet.name, Vet.email, Vet.license_number, Vet.city)) if c is not None]
        # Pending applications first, then approved, then closed; newest first within each.
        rank = case((Vet.deactivated_at.is_not(None), 2), (Vet.is_verified.is_(True), 1), else_=0)
        stmt = select(Vet, appointments, clients).where(*conditions).order_by(rank, Vet.created_at.desc())
        rows, total = self._page(stmt, select(func.count(Vet.id)).where(*conditions), page, page_size)
        items = [
            AdminVetItem.model_validate({
                **{field: getattr(vet, field) for field in (
                    "id", "name", "email", "license_number", "specialty", "city", "phone", "email_verified",
                    "is_verified", "created_at", "slug", "deactivated_at")},
                "status": _vet_status(vet), "appointments_count": n_appointments, "clients_count": n_clients,
            })
            for vet, n_appointments, n_clients in rows
        ]
        return items, total

    def list_owners(self, status_filter: str | None, q: str | None, page: int, page_size: int):
        pets = (select(func.count(Pet.id)).where(Pet.pet_owner_id == PetOwner.id, Pet.deleted_at.is_(None))
                .correlate(PetOwner).scalar_subquery())
        appointments = (select(func.count(Appointment.id)).where(Appointment.pet_owner_id == PetOwner.id)
                        .correlate(PetOwner).scalar_subquery())
        conditions = [c for c in (OWNER_ACCOUNT, OWNER_STATUS_FILTERS.get(status_filter or ""),
                                  _search(q, PetOwner.name, PetOwner.email, PetOwner.phone)) if c is not None]
        stmt = select(PetOwner, pets, appointments).where(*conditions).order_by(PetOwner.created_at.desc())
        rows, total = self._page(stmt, select(func.count(PetOwner.id)).where(*conditions), page, page_size)
        items = [
            AdminOwnerItem(
                id=owner.id, name=owner.name, email=owner.email, phone=owner.phone,
                email_verified=owner.email_verified, suspended_at=owner.suspended_at, created_at=owner.created_at,
                status=_owner_status(owner), pets_count=n_pets, appointments_count=n_appointments,
            )
            for owner, n_pets, n_appointments in rows
        ]
        return items, total

    # --- owner actions ---

    def _owner(self, owner_id: UUID) -> PetOwner:
        owner = self.db.scalar(select(PetOwner).where(PetOwner.id == owner_id, OWNER_ACCOUNT))
        if owner is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ο κηδεμόνας δεν βρέθηκε.")
        return owner

    def suspend_owner(self, owner_id: UUID, admin: Admin) -> AdminOwnerItem:
        owner = self._owner(owner_id)
        if owner.suspended_at is None:
            owner.suspended_at = datetime.utcnow()
            owner.auth_version += 1  # signs the owner out everywhere, web and app
            self.db.commit()
            logger.info("Admin %s suspended owner %s", admin.id, owner.id)
        return self._owner_item(owner)

    def reactivate_owner(self, owner_id: UUID, admin: Admin) -> AdminOwnerItem:
        owner = self._owner(owner_id)
        if owner.suspended_at is not None:
            owner.suspended_at = None
            self.db.commit()
            logger.info("Admin %s reactivated owner %s", admin.id, owner.id)
        return self._owner_item(owner)

    def _owner_item(self, owner: PetOwner) -> AdminOwnerItem:
        items, _ = self.list_owners(None, owner.email, 1, 50)
        return next(item for item in items if item.id == owner.id)
