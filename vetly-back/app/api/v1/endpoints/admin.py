"""Admin panel: sign-in, overview, demo requests, vet accounts and owner accounts."""
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.admin import get_current_admin
from app.core.deps import get_db
from app.core.rate_limit import login_limit
from app.db.base import Admin
from app.schemas.admin import (
    AdminMe, AdminOverview, AdminOwnerItem, AdminOwnerList, AdminVetCreate, AdminVetItem, AdminVetList,
)
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.demo_request import DemoRequestItem, DemoRequestList, DemoRequestUpdate
from app.services.admin_panel import AdminPanelService
from app.services.demo_requests import DemoRequestService

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
    status_filter: Literal["active", "invited", "suspended", "closed"] | None = Query(None, alias="status"),
    q: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    items, total = AdminPanelService(db).list_vets(status_filter, q, page, PAGE_SIZE)
    return AdminVetList(items=items, total=total, page=page, page_size=PAGE_SIZE)


@router.post("/vets", response_model=AdminVetItem, status_code=status.HTTP_201_CREATED)
def create_vet(data: AdminVetCreate, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminPanelService(db).create_vet(data, admin)


@router.post("/vets/{vet_id}/resend-invite", response_model=AdminVetItem)
def resend_vet_invite(vet_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminPanelService(db).resend_invite(vet_id, admin)


@router.post("/vets/{vet_id}/suspend", response_model=AdminVetItem)
def suspend_vet(vet_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminPanelService(db).suspend_vet(vet_id, admin)


@router.post("/vets/{vet_id}/reactivate", response_model=AdminVetItem)
def reactivate_vet(vet_id: UUID, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminPanelService(db).reactivate_vet(vet_id, admin)


@router.get("/demo-requests", response_model=DemoRequestList)
def list_demo_requests(
    status_filter: Literal["new", "contacted", "converted", "closed"] | None = Query(None, alias="status"),
    q: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    items, total = DemoRequestService(db).list(status_filter, q, page, PAGE_SIZE)
    return DemoRequestList(items=items, total=total, page=page, page_size=PAGE_SIZE)


@router.patch("/demo-requests/{request_id}", response_model=DemoRequestItem)
def update_demo_request(
    request_id: UUID, data: DemoRequestUpdate,
    admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db),
):
    return DemoRequestService(db).set_status(request_id, data.status)


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
