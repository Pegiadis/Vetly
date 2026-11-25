"""
Appointment service - business logic layer
"""

from decimal import Decimal
from uuid import UUID
from datetime import date, datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.appointment import AppointmentRepository
from app.models.appointment import AppointmentStatus
from app.models.medication import MedicationFrequency
from app.services.notification import NotificationService
from app.services.reminder import ReminderService
from app.services.scheduling import ATHENS
from app.schemas.appointment import (
    AppointmentDetailResponse,
    AppointmentListResponse,
    AppointmentStatusUpdate,
    AppointmentPetResponse,
    AppointmentPetOwnerResponse,
    CompleteExaminationRequest,
    VetCreateAppointmentRequest,
    VetRescheduleRequest,
)


class AppointmentService:
    """Service for Appointment business logic"""

    def __init__(self, db: Session, background=None):
        """background: FastAPI BackgroundTasks; emails are queued on it after commit."""
        self.db = db
        self.background = background
        self.repository = AppointmentRepository(db)
        self.notifications = NotificationService(db)
        self.reminders = ReminderService(db)

    def _commit(self) -> None:
        """Commit the whole operation at once, then release the queued emails.

        On any failure everything is rolled back and no email is sent.
        """
        try:
            self.db.commit()
        except Exception:
            self._abort()
            raise
        self.notifications.release_emails(self.background)

    def _abort(self) -> None:
        """Roll back the open transaction and drop emails queued for it."""
        self.db.rollback()
        self.notifications.discard_emails()

    def _apply_price(self, appointment, price: Decimal | None) -> None:
        """Set the charged price: the vet's explicit amount, else the service's
        current price when the appointment has none yet. An existing price is
        otherwise kept, so later service price edits never rewrite history."""
        if price is not None:
            appointment.price = price
        elif appointment.price is None and appointment.service_type_id:
            appointment.price = self.repository.get_service_price(
                appointment.service_type_id, appointment.vet_id
            )

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
        from app.repositories.pet import PetRepository
        pet = PetRepository(self.db).get_patient_by_id(data.pet_id, vet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found",
            )

        from app.db.base import Vet
        from app.services.scheduling import check_working_hours
        check_working_hours(self.db.get(Vet, vet_id), data.scheduled_at, data.duration_minutes)

        from app.services.scheduling import check_service
        check_service(self.db, vet_id, data.service_type_id, data.duration_minutes)

        # B2: Check for scheduling conflicts
        if self.repository.has_conflicting_appointment(
            vet_id, data.scheduled_at, data.duration_minutes or 30
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Υπάρχει ήδη ραντεβού αυτή την ώρα.",
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
            service_type_id=getattr(data, "service_type_id", None),
            price=getattr(data, "price", None),
            commit=False,
        )

        try:
            # Re-fetch with relations loaded
            appointment = self.repository.get_by_id(appointment.id, vet_id)

            # Notify owner
            date_str = data.scheduled_at.strftime("%d/%m/%Y %H:%M")
            vet_name = appointment.vet.name if appointment.vet else ""
            self.notifications.notify_owner(
                pet.pet_owner_id,
                type="appointment_new",
                title="Νέο ραντεβού",
                message=f"Ο {vet_name} προγραμμάτισε ραντεβού για {pet.name} στις {date_str}",
                vet_id=vet_id,
                pet_name=pet.name,
                date_str=date_str,
                commit=False,
            )
        except Exception:
            self._abort()
            raise
        self._commit()

        return self._build_detail_response(appointment)

    def list_appointments(
        self,
        vet_id: UUID,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        page_size: int = 10,
        sort_asc: bool = False,
        search: str | None = None,
    ) -> AppointmentListResponse:
        """Get paginated list of vet's appointments"""
        skip = (page - 1) * page_size
        appointments, total = self.repository.get_vet_appointments(
            search=search,
            vet_id=vet_id,
            status=status,
            date_from=date_from,
            date_to=date_to,
            skip=skip,
            limit=page_size,
            sort_asc=sort_asc,
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

        # B3: Validate status transition
        new_status = AppointmentStatus(data.status)
        valid_transitions = {
            AppointmentStatus.PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
            AppointmentStatus.CONFIRMED: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
            AppointmentStatus.COMPLETED: [],
            AppointmentStatus.CANCELLED: [],
        }
        allowed = valid_transitions.get(appointment.status, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Μη έγκυρη αλλαγή κατάστασης.",
            )
        if new_status == AppointmentStatus.COMPLETED:
            self._require_visit_day_reached(appointment)
        if new_status == AppointmentStatus.CONFIRMED:
            self._require_time_not_passed(appointment)
        try:
            updated = self.repository.update_status(
                appointment, new_status, data.notes, commit=False
            )
            if new_status == AppointmentStatus.COMPLETED:
                self._apply_price(appointment, None)

            # Cascade cancellation to group members
            pet_names = [appointment.pet.name] if appointment.pet else []
            if new_status == AppointmentStatus.CANCELLED and appointment.group_id:
                group_apts = self.repository.get_group_appointments(appointment.group_id, vet_id)
                for apt in group_apts:
                    if apt.id != appointment.id and apt.status != AppointmentStatus.CANCELLED:
                        self.repository.update_status(
                            apt, AppointmentStatus.CANCELLED, data.notes, commit=False
                        )
                        if apt.pet and apt.pet.name not in pet_names:
                            pet_names.append(apt.pet.name)

            if new_status == AppointmentStatus.CANCELLED:
                vet_name = appointment.vet.name if appointment.vet else ""
                pet_names_str = ", ".join(pet_names)
                date_str = appointment.scheduled_at.strftime("%d/%m/%Y %H:%M")
                self.notifications.notify_owner(
                    appointment.pet_owner_id,
                    type="appointment_cancel",
                    title="Ραντεβού ακυρώθηκε",
                    message=f"Το ραντεβού σας για {pet_names_str} με {vet_name} ακυρώθηκε",
                    vet_id=vet_id,
                    pet_name=pet_names_str,
                    date_str=date_str,
                    commit=False,
                )
        except Exception:
            self._abort()
            raise
        self._commit()

        return self._build_detail_response(updated)

    def approve_appointment(
        self, appointment_id: UUID, vet_id: UUID, price: Decimal | None = None
    ) -> AppointmentDetailResponse:
        """Approve a pending appointment request, optionally setting its price"""
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
        self._require_time_not_passed(appointment)

        from app.services.scheduling import check_time_off
        check_time_off(self.db, vet_id, appointment.scheduled_at, appointment.duration_minutes or 30)

        try:
            updated = self.repository.update_status(
                appointment, AppointmentStatus.CONFIRMED, commit=False
            )
            self._apply_price(appointment, price)

            # Cascade to group members
            pet_names = [appointment.pet.name] if appointment.pet else []
            if appointment.group_id:
                group_apts = self.repository.get_group_appointments(appointment.group_id, vet_id)
                for apt in group_apts:
                    if apt.id != appointment.id and apt.status == AppointmentStatus.PENDING:
                        self.repository.update_status(
                            apt, AppointmentStatus.CONFIRMED, commit=False
                        )
                        self._apply_price(apt, None)
                        if apt.pet and apt.pet.name not in pet_names:
                            pet_names.append(apt.pet.name)

            # Notify owner
            vet_name = appointment.vet.name if appointment.vet else ""
            pet_names_str = ", ".join(pet_names)
            date_str = appointment.scheduled_at.strftime("%d/%m/%Y %H:%M")
            self.notifications.notify_owner(
                appointment.pet_owner_id,
                type="appointment_confirm",
                title="Ραντεβού επιβεβαιώθηκε",
                message=f"Το ραντεβού σας για {pet_names_str} με {vet_name} επιβεβαιώθηκε",
                vet_id=vet_id,
                pet_name=pet_names_str,
                date_str=date_str,
                commit=False,
            )
        except Exception:
            self._abort()
            raise
        self._commit()

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
        try:
            updated = self.repository.update_status(
                appointment, AppointmentStatus.CANCELLED, notes, commit=False
            )

            # Cascade to group members
            pet_names = [appointment.pet.name] if appointment.pet else []
            if appointment.group_id:
                group_apts = self.repository.get_group_appointments(appointment.group_id, vet_id)
                for apt in group_apts:
                    if apt.id != appointment.id and apt.status == AppointmentStatus.PENDING:
                        self.repository.update_status(
                            apt, AppointmentStatus.CANCELLED, notes, commit=False
                        )
                        if apt.pet and apt.pet.name not in pet_names:
                            pet_names.append(apt.pet.name)

            # Notify owner
            vet_name = appointment.vet.name if appointment.vet else ""
            pet_names_str = ", ".join(pet_names)
            date_str = appointment.scheduled_at.strftime("%d/%m/%Y %H:%M")
            self.notifications.notify_owner(
                appointment.pet_owner_id,
                type="appointment_reject",
                title="Ραντεβού απορρίφθηκε",
                message=f"Το ραντεβού σας για {pet_names_str} με {vet_name} απορρίφθηκε",
                vet_id=vet_id,
                pet_name=pet_names_str,
                date_str=date_str,
                commit=False,
            )
        except Exception:
            self._abort()
            raise
        self._commit()

        return self._build_detail_response(updated)

    @staticmethod
    def _require_time_not_passed(appointment) -> None:
        """A request is confirmed before its time: confirming a visit in the past tells the owner
        about an appointment that can no longer happen. The worker closes such requests."""
        if appointment.scheduled_at < datetime.now(ATHENS).replace(tzinfo=None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Η ώρα που ζητήθηκε έχει περάσει. Απορρίψτε το αίτημα ή κανονίστε νέα ώρα με τον κηδεμόνα.",
            )

    @staticmethod
    def _require_visit_day_reached(appointment) -> None:
        """A visit is completed on or after its day: completing a future one
        would count it as done before it happened and skew the monthly figures."""
        if appointment.scheduled_at.date() > datetime.now(ATHENS).date():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Η επίσκεψη δεν έχει γίνει ακόμα. Η εξέταση καταχωρίζεται από την ημέρα του ραντεβού και μετά.",
            )

    def complete_examination(
        self,
        appointment_id: UUID,
        vet_id: UUID,
        data: CompleteExaminationRequest,
    ) -> AppointmentDetailResponse:
        """Complete an examination: create medical event, medications, mark completed.

        Everything (medical event, medications, price, status, reminder and
        notification) is written in one transaction; any failure rolls it all
        back, and the owner email is only sent after the commit."""
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
        self._require_visit_day_reached(appointment)

        try:
            today = datetime.now(ATHENS).date()

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

            # Final charged amount: the vet's figure, else the booked price
            self._apply_price(appointment, data.price)

            # Mark appointment as completed
            updated = self.repository.update_status(
                appointment, AppointmentStatus.COMPLETED, data.examination_notes, commit=False
            )

            # Auto-create vaccination reminder if the appointment type indicates vaccination
            appointment_type_lower = (appointment.type or "").lower()
            if "vaccination" in appointment_type_lower or "εμβολ" in appointment_type_lower:
                self.reminders.auto_create_vaccination_reminder(
                    db=self.db,
                    pet_id=appointment.pet_id,
                    vet_id=vet_id,
                    vaccination_title=data.diagnosis,
                )

            # Notify owner
            pet_name = appointment.pet.name if appointment.pet else ""
            date_str = appointment.scheduled_at.strftime("%d/%m/%Y %H:%M")
            self.notifications.notify_owner(
                appointment.pet_owner_id,
                type="appointment_complete",
                title="Εξέταση ολοκληρώθηκε",
                message=f"Η εξέταση του {pet_name} ολοκληρώθηκε. Διάγνωση: {data.diagnosis}",
                vet_id=vet_id,
                pet_name=pet_name,
                date_str=date_str,
                commit=False,
            )
        except Exception:
            self._abort()
            raise
        self._commit()

        return self._build_detail_response(updated)

    def reschedule_appointment(
        self,
        appointment_id: UUID,
        vet_id: UUID,
        data: VetRescheduleRequest,
    ) -> AppointmentDetailResponse:
        """Reschedule an appointment (vet-initiated, stays confirmed)"""
        appointment = self.repository.get_by_id(appointment_id, vet_id)

        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found",
            )

        if appointment.status not in (AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Μόνο ενεργά ραντεβού μπορούν να αναπρογραμματιστούν.",
            )

        from app.db.base import Vet
        from app.services.scheduling import check_working_hours
        check_working_hours(self.db.get(Vet, vet_id), data.scheduled_at, appointment.duration_minutes or 30)

        # Check for conflicts at the new time
        if self.repository.has_conflicting_appointment(
            vet_id, data.scheduled_at, appointment.duration_minutes or 30,
            exclude_id=appointment.id,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Υπάρχει ήδη ραντεβού αυτή την ώρα.",
            )

        # Update scheduled_at, keep status as CONFIRMED (vet-initiated)
        try:
            appointment.scheduled_at = data.scheduled_at
            appointment.status = AppointmentStatus.CONFIRMED

            # Notify owner about the reschedule
            pet_name = appointment.pet.name if appointment.pet else ""
            vet_name = appointment.vet.name if appointment.vet else ""
            new_date_str = data.scheduled_at.strftime("%d/%m/%Y %H:%M")
            self.notifications.notify_owner(
                appointment.pet_owner_id,
                type="appointment_reschedule",
                title="Αναπρογραμματισμός ραντεβού",
                message=f"Ο {vet_name} αναπρογραμμάτισε το ραντεβού για {pet_name} στις {new_date_str}",
                vet_id=vet_id,
                pet_name=pet_name,
                date_str=new_date_str,
                commit=False,
            )
        except Exception:
            self._abort()
            raise
        self._commit()
        self.db.refresh(appointment)

        return self._build_detail_response(appointment)
