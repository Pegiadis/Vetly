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
    RevenueServiceItem,
    RevenueMonthItem,
    RevenueResponse,
    FullAnalyticsResponse,
)
from app.services.scheduling import ATHENS


def _athens_today() -> date:
    """Today's date on the Athens wall clock (appointments are stored in Athens time)."""
    return datetime.now(ATHENS).date()


class AnalyticsService:
    """Service for vet analytics"""

    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_stats(self, vet_id: UUID) -> DashboardStatsResponse:
        """Get dashboard summary statistics"""
        today = _athens_today()
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
        end_date = _athens_today()
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

    def get_revenue(self, vet_id: UUID) -> RevenueResponse:
        """Revenue from completed visits only.

        Cancelled, pending and confirmed appointments are never counted. The
        amount is the price stored on each appointment (the final charge), so
        later edits to a service's price do not change past revenue. Completed
        visits without a price are counted separately and kept out of the
        average.
        """
        today = _athens_today()
        month_start = today.replace(day=1)
        last30_start = today - timedelta(days=29)
        day_after = datetime.combine(today + timedelta(days=1), datetime.min.time())

        completed = [
            Appointment.vet_id == vet_id,
            Appointment.status == AppointmentStatus.COMPLETED,
        ]
        priced = [*completed, Appointment.price.is_not(None)]

        def money(value) -> float:
            return round(float(value or 0), 2)

        def window(start: date):
            return [
                *priced,
                Appointment.scheduled_at >= datetime.combine(start, datetime.min.time()),
                Appointment.scheduled_at < day_after,
            ]

        totals = self.db.execute(
            select(func.count(Appointment.id), func.coalesce(func.sum(Appointment.price), 0))
            .where(*priced)
        ).one()
        completed_count = self.db.scalar(
            select(func.count(Appointment.id)).where(*completed)
        ) or 0
        this_month = self.db.execute(
            select(func.count(Appointment.id), func.coalesce(func.sum(Appointment.price), 0))
            .where(*window(month_start))
        ).one()
        last30 = self.db.execute(
            select(func.count(Appointment.id), func.coalesce(func.sum(Appointment.price), 0))
            .where(*window(last30_start))
        ).one()

        by_service_rows = self.db.execute(
            select(
                Appointment.type,
                func.count(Appointment.id).label("count"),
                func.sum(Appointment.price).label("revenue"),
            )
            .where(*priced)
            .group_by(Appointment.type)
            .order_by(func.sum(Appointment.price).desc())
        ).all()

        # Last 12 calendar months, oldest first, empty months included
        months: list[date] = []
        cursor = month_start
        for _ in range(12):
            months.append(cursor)
            cursor = (cursor - timedelta(days=1)).replace(day=1)
        months.reverse()
        month_expr = func.date_trunc("month", Appointment.scheduled_at)
        month_rows = {
            row.month.date(): row
            for row in self.db.execute(
                select(
                    month_expr.label("month"),
                    func.count(Appointment.id).label("count"),
                    func.sum(Appointment.price).label("revenue"),
                )
                .where(
                    *priced,
                    Appointment.scheduled_at >= datetime.combine(months[0], datetime.min.time()),
                    Appointment.scheduled_at < day_after,
                )
                .group_by(month_expr)
            ).all()
        }

        priced_count, total_revenue = totals[0], money(totals[1])
        return RevenueResponse(
            total_revenue=total_revenue,
            completed_count=completed_count,
            priced_count=priced_count,
            unpriced_count=max(completed_count - priced_count, 0),
            average_per_visit=round(total_revenue / priced_count, 2) if priced_count else 0.0,
            this_month_revenue=money(this_month[1]),
            this_month_count=this_month[0],
            last_30_days_revenue=money(last30[1]),
            last_30_days_count=last30[0],
            by_service=[
                RevenueServiceItem(
                    service_type=row.type, count=row.count, revenue=money(row.revenue)
                )
                for row in by_service_rows
            ],
            by_month=[
                RevenueMonthItem(
                    month=m.strftime("%Y-%m"),
                    count=month_rows[m].count if m in month_rows else 0,
                    revenue=money(month_rows[m].revenue) if m in month_rows else 0.0,
                )
                for m in months
            ],
        )

    def get_full_analytics(self, vet_id: UUID) -> FullAnalyticsResponse:
        """Get full analytics data"""
        return FullAnalyticsResponse(
            dashboard=self.get_dashboard_stats(vet_id),
            appointment_trends=self.get_appointment_trends(vet_id),
            service_breakdown=self.get_service_breakdown(vet_id),
            peak_hours=self.get_peak_hours(vet_id),
            patient_types=self.get_patient_types(vet_id),
            revenue=self.get_revenue(vet_id),
        )

