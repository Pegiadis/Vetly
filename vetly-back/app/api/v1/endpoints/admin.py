"""Admin panel: sign-in, overview, vet verification and owner accounts."""
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.admin import get_current_admin
from app.core.deps import get_db
from app.core.rate_limit import login_limit
from app.db.base import Admin
from app.schemas.admin import (
    AdminMe, AdminOverview, AdminOwnerItem, AdminOwnerList, AdminVetList, PendingVet,
)
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.admin_panel import AdminPanelService
from app.services.admin_verification import AdminVerificationService

router = APIRouter()

PAGE_SIZE = 25


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_limit)])
def admin_login(credentials: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return TokenResponse(access_token=AdminPanelService(db).login(credentials.email, credentials.password))


@router.get("/me", response_model=AdminMe)
def admin_me(admin: Admin = Depends(get_current_admin)):
    return admin


@router.get("/overview", response_model=AdminOverview)
def overview(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminPanelService(db).overview()


@router.get("/vets", response_model=AdminVetList)
def list_vets(
    status_filter: Literal["pending", "approved", "closed"] | None = Query(None, alias="status"),
    q: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    items, total = AdminPanelService(db).list_vets(status_filter, q, page, PAGE_SIZE)
    return AdminVetList(items=items, total=total, page=page, page_size=PAGE_SIZE)


@router.post("/vets/{vet_id}/approve", response_model=PendingVet)
def approve_vet(vet_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminVerificationService(db).approve(vet_id, admin)


@router.post("/vets/{vet_id}/revoke", response_model=PendingVet)
def revoke_vet(vet_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminVerificationService(db).revoke(vet_id, admin)


@router.post("/vets/{vet_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_vet(vet_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    AdminVerificationService(db).reject(vet_id, admin)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/owners", response_model=AdminOwnerList)
def list_owners(
    status_filter: Literal["active", "unverified", "suspended"] | None = Query(None, alias="status"),
    q: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    items, total = AdminPanelService(db).list_owners(status_filter, q, page, PAGE_SIZE)
    return AdminOwnerList(items=items, total=total, page=page, page_size=PAGE_SIZE)


@router.post("/owners/{owner_id}/suspend", response_model=AdminOwnerItem)
def suspend_owner(owner_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminPanelService(db).suspend_owner(owner_id, admin)


@router.post("/owners/{owner_id}/reactivate", response_model=AdminOwnerItem)
def reactivate_owner(owner_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminPanelService(db).reactivate_owner(owner_id, admin)
