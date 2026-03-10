"""
Analytics service - business logic layer for vet analytics
"""

from uuid import UUID
from datetime import date, datetime, timedelta
from sqlalchemy import select, func, distinct, extract, cast, Date
from sqlalchemy.orm import Session

from app.db.base import Appointment, Pet, Review, VetClient
from app.models.appointment import AppointmentStatus

from app.schemas.analytics import (
    DashboardStatsResponse,
    AppointmentTrendResponse,
    AppointmentTrendItem,
    ServiceBreakdownResponse,
    ServiceBreakdownItem,
    PeakHoursResponse,
    PeakHourItem,
    PatientTypeResponse,
    PatientTypeItem,
    FullAnalyticsResponse,
)


class AnalyticsService:
    """Service for vet analytics"""

    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_stats(self, vet_id: UUID) -> DashboardStatsResponse:
        """Get dashboard summary statistics"""
        today = date.today()
        tomorrow = today + timedelta(days=1)
        month_start = today.replace(day=1)

        # Total unique patients (pets with appointments)
        total_patients = self.db.scalar(
            select(func.count(distinct(Appointment.pet_id)))
            .where(Appointment.vet_id == vet_id)
        ) or 0

        # Total clients
        total_clients = self.db.scalar(
            select(func.count(VetClient.id))
            .where(VetClient.vet_id == vet_id)
        ) or 0

        # Total appointments
        total_appointments = self.db.scalar(
            select(func.count(Appointment.id))
            .where(Appointment.vet_id == vet_id)
        ) or 0

        # Pending appointments
        pending_appointments = self.db.scalar(
            select(func.count(Appointment.id))
            .where(
                Appointment.vet_id == vet_id,
                Appointment.status == AppointmentStatus.PENDING,
            )
        ) or 0

        # Today's appointments
        today_appointments = self.db.scalar(
            select(func.count(Appointment.id))
            .where(
                Appointment.vet_id == vet_id,
                Appointment.scheduled_at >= datetime.combine(today, datetime.min.time()),
                Appointment.scheduled_at < datetime.combine(tomorrow, datetime.min.time()),
            )
        ) or 0

        # Completed this month
        completed_this_month = self.db.scalar(
            select(func.count(Appointment.id))
            .where(
                Appointment.vet_id == vet_id,
                Appointment.status == AppointmentStatus.COMPLETED,
                Appointment.scheduled_at >= datetime.combine(month_start, datetime.min.time()),
            )
        ) or 0

        # Review stats
        review_stats = self.db.execute(
            select(
                func.count(Review.id).label("total"),
                func.avg(Review.rating).label("average"),
            ).where(Review.vet_id == vet_id)
        ).first()

        total_reviews = review_stats.total or 0
        average_rating = float(review_stats.average) if review_stats.average else 0.0

        return DashboardStatsResponse(
            total_patients=total_patients,
            total_clients=total_clients,
            total_appointments=total_appointments,
            pending_appointments=pending_appointments,
            today_appointments=today_appointments,
            completed_this_month=completed_this_month,
            average_rating=round(average_rating, 2),
            total_reviews=total_reviews,
        )

    def get_appointment_trends(
        self, vet_id: UUID, days: int = 30
    ) -> AppointmentTrendResponse:
        """Get appointment trends over time"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        # Query appointments grouped by date
        query = (
            select(
                cast(Appointment.scheduled_at, Date).label("date"),
                func.count(Appointment.id).label("count"),
            )
            .where(
                Appointment.vet_id == vet_id,
                Appointment.scheduled_at >= datetime.combine(start_date, datetime.min.time()),
                Appointment.scheduled_at < datetime.combine(end_date + timedelta(days=1), datetime.min.time()),
            )
            .group_by(cast(Appointment.scheduled_at, Date))
            .order_by(cast(Appointment.scheduled_at, Date))
        )

        results = self.db.execute(query).all()

        # Create a dict of date -> count
        date_counts = {row.date: row.count for row in results}

        # Fill in all dates in range
        items = []
        current_date = start_date
        total = 0
        while current_date <= end_date:
            count = date_counts.get(current_date, 0)
            items.append(AppointmentTrendItem(date=current_date, count=count))
            total += count
            current_date += timedelta(days=1)

        return AppointmentTrendResponse(
            items=items,
            total=total,
            period_start=start_date,
            period_end=end_date,
        )

    def get_service_breakdown(self, vet_id: UUID) -> ServiceBreakdownResponse:
        """Get service type breakdown"""
        query = (
            select(
                Appointment.type,
                func.count(Appointment.id).label("count"),
            )
            .where(Appointment.vet_id == vet_id)
            .group_by(Appointment.type)
            .order_by(func.count(Appointment.id).desc())
        )

        results = self.db.execute(query).all()

        total = sum(row.count for row in results)

        items = [
            ServiceBreakdownItem(
                service_type=row.type,
                count=row.count,
                percentage=round(row.count / total * 100, 1) if total > 0 else 0,
            )
            for row in results
        ]

        return ServiceBreakdownResponse(items=items, total=total)

    def get_peak_hours(self, vet_id: UUID) -> PeakHoursResponse:
        """Get peak hours analysis"""
        query = (
            select(
                extract("hour", Appointment.scheduled_at).label("hour"),
                func.count(Appointment.id).label("count"),
            )
            .where(Appointment.vet_id == vet_id)
            .group_by(extract("hour", Appointment.scheduled_at))
            .order_by(extract("hour", Appointment.scheduled_at))
        )

        results = self.db.execute(query).all()

        total = sum(row.count for row in results)

        # Find busiest hour
        busiest_hour = 0
        max_count = 0
        for row in results:
            if row.count > max_count:
                max_count = row.count
                busiest_hour = int(row.hour)

        items = [
            PeakHourItem(
                hour=int(row.hour),
                count=row.count,
                percentage=round(row.count / total * 100, 1) if total > 0 else 0,
            )
            for row in results
        ]

        return PeakHoursResponse(
            items=items,
            busiest_hour=busiest_hour,
            total_appointments=total,
        )

    def get_patient_types(self, vet_id: UUID) -> PatientTypeResponse:
        """Get patient type distribution"""
        # Subquery for pets that have appointments with this vet
        pets_subquery = (
            select(distinct(Appointment.pet_id))
            .where(Appointment.vet_id == vet_id)
            .subquery()
        )

        query = (
            select(
                Pet.type,
                func.count(Pet.id).label("count"),
            )
            .where(Pet.id.in_(select(pets_subquery)))
            .group_by(Pet.type)
            .order_by(func.count(Pet.id).desc())
        )

        results = self.db.execute(query).all()

        total = sum(row.count for row in results)

        items = [
            PatientTypeItem(
                pet_type=row.type.value if hasattr(row.type, 'value') else str(row.type),
                count=row.count,
                percentage=round(row.count / total * 100, 1) if total > 0 else 0,
            )
            for row in results
        ]

        return PatientTypeResponse(items=items, total=total)

    def get_full_analytics(self, vet_id: UUID) -> FullAnalyticsResponse:
        """Get full analytics data"""
        return FullAnalyticsResponse(
            dashboard=self.get_dashboard_stats(vet_id),
            appointment_trends=self.get_appointment_trends(vet_id),
            service_breakdown=self.get_service_breakdown(vet_id),
            peak_hours=self.get_peak_hours(vet_id),
            patient_types=self.get_patient_types(vet_id),
        )

