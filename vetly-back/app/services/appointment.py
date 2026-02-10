"""
Appointment service - business logic layer
"""

from uuid import UUID
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.appointment import AppointmentRepository
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import (
    AppointmentDetailResponse,
    AppointmentListResponse,
    AppointmentStatusUpdate,
    AppointmentPetResponse,
    AppointmentPetOwnerResponse,
)


class AppointmentService:
    """Service for Appointment business logic"""

    def __init__(self, db: Session):
        self.repository = AppointmentRepository(db)

    def _build_detail_response(self, appointment) -> AppointmentDetailResponse:
        """Build a detailed appointment response with pet and pet owner info"""
        response = AppointmentDetailResponse.model_validate(appointment)
        if appointment.pet:
            response.pet = AppointmentPetResponse.model_validate(appointment.pet)
        if appointment.pet_owner:
            response.pet_owner = AppointmentPetOwnerResponse.model_validate(appointment.pet_owner)
        return response

    def list_appointments(
        self,
        vet_id: UUID,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> AppointmentListResponse:
        """Get paginated list of vet's appointments"""
        skip = (page - 1) * page_size
        appointments, total = self.repository.get_vet_appointments(
            vet_id=vet_id,
            status=status,
            date_from=date_from,
            date_to=date_to,
            skip=skip,
            limit=page_size,
        )

        return AppointmentListResponse(
            items=[self._build_detail_response(apt) for apt in appointments],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_today_appointments(
        self, vet_id: UUID, page: int = 1, page_size: int = 50
    ) -> AppointmentListResponse:
        """Get today's appointments for a vet"""
        skip = (page - 1) * page_size
        appointments, total = self.repository.get_today_appointments(
            vet_id=vet_id, skip=skip, limit=page_size
        )

        return AppointmentListResponse(
            items=[self._build_detail_response(apt) for apt in appointments],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_pending_appointments(
        self, vet_id: UUID, page: int = 1, page_size: int = 50
    ) -> AppointmentListResponse:
        """Get pending appointment requests for a vet"""
        skip = (page - 1) * page_size
        appointments, total = self.repository.get_pending_appointments(
            vet_id=vet_id, skip=skip, limit=page_size
        )

        return AppointmentListResponse(
            items=[self._build_detail_response(apt) for apt in appointments],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_appointment(
        self, appointment_id: UUID, vet_id: UUID
    ) -> AppointmentDetailResponse:
        """Get a specific appointment by ID"""
        appointment = self.repository.get_by_id(appointment_id, vet_id)

        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        return self._build_detail_response(appointment)

    def update_status(
        self,
        appointment_id: UUID,
        vet_id: UUID,
        data: AppointmentStatusUpdate,
    ) -> AppointmentDetailResponse:
        """Update an appointment's status"""
        appointment = self.repository.get_by_id(appointment_id, vet_id)

        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        # Validate status transition
        new_status = AppointmentStatus(data.status)
        updated = self.repository.update_status(appointment, new_status, data.notes)

        return self._build_detail_response(updated)

    def approve_appointment(
        self, appointment_id: UUID, vet_id: UUID
    ) -> AppointmentDetailResponse:
        """Approve a pending appointment request"""
        appointment = self.repository.get_by_id(appointment_id, vet_id)

        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        if appointment.status != AppointmentStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only approve pending appointments",
            )

        updated = self.repository.update_status(appointment, AppointmentStatus.CONFIRMED)
        return self._build_detail_response(updated)

    def reject_appointment(
        self, appointment_id: UUID, vet_id: UUID, reason: str | None = None
    ) -> AppointmentDetailResponse:
        """Reject a pending appointment request"""
        appointment = self.repository.get_by_id(appointment_id, vet_id)

        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        if appointment.status != AppointmentStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only reject pending appointments",
            )

        notes = f"Rejected: {reason}" if reason else "Rejected by vet"
        updated = self.repository.update_status(
            appointment, AppointmentStatus.CANCELLED, notes
        )
        return self._build_detail_response(updated)
