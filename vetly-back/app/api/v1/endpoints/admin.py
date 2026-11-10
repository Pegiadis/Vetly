"""Admin endpoints: professional verification of vet registrations."""
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.admin import get_current_admin
from app.core.deps import get_db
from app.db.base import Vet
from app.schemas.admin import PendingVet, PendingVetList
from app.services.admin_verification import AdminVerificationService

router = APIRouter()


@router.get("/vets/pending", response_model=PendingVetList)
def list_pending_vets(admin: Vet = Depends(get_current_admin), db: Session = Depends(get_db)):
    items, total = AdminVerificationService(db).list_pending()
    return PendingVetList(items=items, total=total)


@router.post("/vets/{vet_id}/approve", response_model=PendingVet)
def approve_vet(vet_id: UUID, admin: Vet = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminVerificationService(db).approve(vet_id, admin)


@router.post("/vets/{vet_id}/revoke", response_model=PendingVet)
def revoke_vet(vet_id: UUID, admin: Vet = Depends(get_current_admin), db: Session = Depends(get_db)):
    return AdminVerificationService(db).revoke(vet_id, admin)


@router.post("/vets/{vet_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_vet(vet_id: UUID, admin: Vet = Depends(get_current_admin), db: Session = Depends(get_db)):
    AdminVerificationService(db).reject(vet_id, admin)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
