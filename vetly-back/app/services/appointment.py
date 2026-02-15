"""
Appointment service - business logic layer
"""

from uuid import UUID
from datetime import date, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.appointment import AppointmentRepository
from app.models.appointment import AppointmentStatus
from app.models.medication import MedicationFrequency
from app.services.notification import NotificationService
from app.schemas.appointment import (
    AppointmentDetailResponse,
    AppointmentListResponse,
    AppointmentStatusUpdate,
    AppointmentPetResponse,
    AppointmentPetOwnerResponse,
    CompleteExaminationRequest,
    VetCreateAppointmentRequest,
)


class AppointmentService:
    """Service for Appointment business logic"""

    def __init__(self, db: Session):
        self.repository = AppointmentRepository(db)
        self.notifications = NotificationService(db)

    def _build_detail_response(self, appointment) -> AppointmentDetailResponse:
        """Build a detailed appointment response with pet and pet owner info"""
        response = AppointmentDetailResponse.model_validate(appointment)
        if appointment.pet:
            response.pet = AppointmentPetResponse.model_validate(appointment.pet)
        if appointment.pet_owner:
            response.pet_owner = AppointmentPetOwnerResponse.model_validate(appointment.pet_owner)
        return response

    def create_appointment(
        self,
        vet_id: UUID,
        data: VetCreateAppointmentRequest,
    ) -> AppointmentDetailResponse:
        """Create an appointment for a patient (vet-initiated, auto-confirmed)"""
        pet = self.repository.get_pet_by_id(data.pet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found",
            )

        appointment = self.repository.create_appointment(
            vet_id=vet_id,
            pet_owner_id=pet.pet_owner_id,
            pet_id=data.pet_id,
            scheduled_at=data.scheduled_at,
            appointment_type=data.type,
            duration_minutes=data.duration_minutes,
            notes=data.notes,
            status=AppointmentStatus.CONFIRMED,
        )

        # Re-fetch with relations loaded
        appointment = self.repository.get_by_id(appointment.id, vet_id)

        # Notify owner
        date_str = data.scheduled_at.strftime("%d/%m/%Y %H:%M")
        vet_name = appointment.vet.name if appointment.vet else ""
        self.notifications.notify_owner(
            pet.pet_owner_id,
            type="appointment",
            title="Νέο ραντεβού",
            message=f"Ο {vet_name} προγραμμάτισε ραντεβού για {pet.name} στις {date_str}",
        )

        return self._build_detail_response(appointment)

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

        # Notify owner
        pet_name = appointment.pet.name if appointment.pet else ""
        vet_name = appointment.vet.name if appointment.vet else ""
        self.notifications.notify_owner(
            appointment.pet_owner_id,
            type="appointment",
            title="Ραντεβού επιβεβαιώθηκε",
            message=f"Το ραντεβού σας για {pet_name} με {vet_name} επιβεβαιώθηκε",
        )

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

        # Notify owner
        pet_name = appointment.pet.name if appointment.pet else ""
        vet_name = appointment.vet.name if appointment.vet else ""
        self.notifications.notify_owner(
            appointment.pet_owner_id,
            type="appointment",
            title="Ραντεβού απορρίφθηκε",
            message=f"Το ραντεβού σας για {pet_name} με {vet_name} απορρίφθηκε",
        )

        return self._build_detail_response(updated)

    def complete_examination(
        self,
        appointment_id: UUID,
        vet_id: UUID,
        data: CompleteExaminationRequest,
    ) -> AppointmentDetailResponse:
        """Complete an examination: create medical event, medications, mark completed"""
        appointment = self.repository.get_by_id(appointment_id, vet_id)

        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        if appointment.status not in (AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only complete confirmed or pending appointments",
            )

        today = date.today()

        # Create medical event
        self.repository.create_medical_event(
            pet_id=appointment.pet_id,
            vet_id=vet_id,
            event_date=today,
            title=data.diagnosis,
            event_type=appointment.type,
            notes=data.examination_notes,
        )

        # Create medications
        for med in data.medications:
            end_date = today + timedelta(days=med.duration_days) if med.duration_days else None
            self.repository.create_medication(
                pet_id=appointment.pet_id,
                name=med.name,
                dosage=med.dosage,
                frequency=MedicationFrequency(med.frequency),
                med_time=med.time,
                start_date=today,
                end_date=end_date,
                notes=med.notes,
            )

        # Mark appointment as completed
        updated = self.repository.update_status(
            appointment, AppointmentStatus.COMPLETED, data.examination_notes
        )

        # Notify owner
        pet_name = appointment.pet.name if appointment.pet else ""
        self.notifications.notify_owner(
            appointment.pet_owner_id,
            type="appointment",
            title="Εξέταση ολοκληρώθηκε",
            message=f"Η εξέταση του {pet_name} ολοκληρώθηκε. Διάγνωση: {data.diagnosis}",
        )

        return self._build_detail_response(updated)
