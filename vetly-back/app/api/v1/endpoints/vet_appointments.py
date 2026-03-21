"""
Vet Appointment Management API endpoints
"""

from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.appointment import AppointmentService
from app.schemas.appointment import (
    AppointmentListResponse,
    AppointmentDetailResponse,
    AppointmentStatusUpdate,
    AppointmentRejectRequest,
    CompleteExaminationRequest,
    VetCreateAppointmentRequest,
    VetRescheduleRequest,
)

router = APIRouter()


@router.post("", response_model=AppointmentDetailResponse, status_code=201)
def create_appointment(
    data: VetCreateAppointmentRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentDetailResponse:
    """Create a new appointment for a patient (vet-initiated, auto-confirmed)"""
    service = AppointmentService(db)
    return service.create_appointment(vet_id=current_vet.id, data=data)


@router.get("", response_model=AppointmentListResponse)
def list_appointments(
    status: str | None = Query(None, description="Filter by status (pending, confirmed, completed, cancelled)"),
    date_from: date | None = Query(None, description="Filter from date"),
    date_to: date | None = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentListResponse:
    """Get paginated list of vet's appointments"""
    service = AppointmentService(db)
    return service.list_appointments(
        vet_id=current_vet.id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )


@router.get("/today", response_model=AppointmentListResponse)
def get_today_appointments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentListResponse:
    """Get today's appointments for the vet"""
    service = AppointmentService(db)
    return service.get_today_appointments(
        vet_id=current_vet.id,
        page=page,
        page_size=page_size,
    )


@router.get("/pending", response_model=AppointmentListResponse)
def get_pending_appointments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentListResponse:
    """Get pending appointment requests for the vet"""
    service = AppointmentService(db)
    return service.get_pending_appointments(
        vet_id=current_vet.id,
        page=page,
        page_size=page_size,
    )


@router.get("/{appointment_id}", response_model=AppointmentDetailResponse)
def get_appointment(
    appointment_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentDetailResponse:
    """Get a specific appointment by ID"""
    service = AppointmentService(db)
    return service.get_appointment(
        appointment_id=appointment_id,
        vet_id=current_vet.id,
    )


@router.patch("/{appointment_id}/status", response_model=AppointmentDetailResponse)
def update_appointment_status(
    appointment_id: UUID,
    data: AppointmentStatusUpdate,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentDetailResponse:
    """Update an appointment's status"""
    service = AppointmentService(db)
    return service.update_status(
        appointment_id=appointment_id,
        vet_id=current_vet.id,
        data=data,
    )


@router.post("/{appointment_id}/approve", response_model=AppointmentDetailResponse)
def approve_appointment(
    appointment_id: UUID,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentDetailResponse:
    """Approve a pending appointment request"""
    service = AppointmentService(db)
    return service.approve_appointment(
        appointment_id=appointment_id,
        vet_id=current_vet.id,
    )


@router.post("/{appointment_id}/reject", response_model=AppointmentDetailResponse)
def reject_appointment(
    appointment_id: UUID,
    data: AppointmentRejectRequest | None = None,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentDetailResponse:
    """Reject a pending appointment request"""
    service = AppointmentService(db)
    reason = data.reason if data else None
    return service.reject_appointment(
        appointment_id=appointment_id,
        vet_id=current_vet.id,
        reason=reason,
    )


@router.post("/{appointment_id}/reschedule", response_model=AppointmentDetailResponse)
def reschedule_appointment(
    appointment_id: UUID,
    data: VetRescheduleRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentDetailResponse:
    """Reschedule an appointment to a new date/time (vet-initiated, stays confirmed)"""
    service = AppointmentService(db)
    return service.reschedule_appointment(
        appointment_id=appointment_id,
        vet_id=current_vet.id,
        data=data,
    )


@router.post("/{appointment_id}/complete", response_model=AppointmentDetailResponse)
def complete_examination(
    appointment_id: UUID,
    data: CompleteExaminationRequest,
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentDetailResponse:
    """Complete an examination: record diagnosis, medications, and mark appointment completed"""
    service = AppointmentService(db)
    return service.complete_examination(
        appointment_id=appointment_id,
        vet_id=current_vet.id,
        data=data,
    )
