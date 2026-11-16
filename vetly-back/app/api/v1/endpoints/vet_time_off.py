"""
Vet time off / closures API endpoints
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_vet, get_db
from app.db.base import Vet
from app.schemas.vet_time_off import ClosedDatesResponse, TimeOffCreate, TimeOffCreateResponse, TimeOffResponse
from app.services.vet_time_off import VetTimeOffService

router = APIRouter()


@router.get("", response_model=list[TimeOffResponse])
def list_time_off(current_vet: Vet = Depends(get_current_vet), db: Session = Depends(get_db)):
    """Upcoming and ongoing closures of the vet"""
    return VetTimeOffService(db).list_upcoming(current_vet.id)


@router.post("", response_model=TimeOffCreateResponse, status_code=201)
def create_time_off(
    data: TimeOffCreate,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
):
    """Create a closure; the response lists active appointments that fall inside it"""
    return VetTimeOffService(db).create(current_vet.id, data)


@router.delete("/{entry_id}", status_code=204)
def delete_time_off(
    entry_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> None:
    VetTimeOffService(db).delete(current_vet.id, entry_id)


closed_dates_router = APIRouter()


@closed_dates_router.get("/{vet_id}/closed-dates", response_model=ClosedDatesResponse)
def get_closed_dates(
    vet_id: UUID,
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    _user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Whole-day closed dates of a vet in a range, for the booking calendar"""
    return VetTimeOffService(db).closed_dates(vet_id, from_date, to_date)
