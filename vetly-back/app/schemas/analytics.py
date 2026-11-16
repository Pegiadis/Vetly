"""
Analytics schemas for request/response validation
"""

from datetime import date
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    """Dashboard summary statistics"""
    total_patients: int
    total_clients: int
    total_appointments: int
    pending_appointments: int
    today_appointments: int
    completed_this_month: int
    average_rating: float
    total_reviews: int


class AppointmentTrendItem(BaseModel):
    """Appointment trend data point"""
    date: date
    count: int


class AppointmentTrendResponse(BaseModel):
    """Appointments over time"""
    items: list[AppointmentTrendItem]
    total: int
    period_start: date
    period_end: date


class ServiceBreakdownItem(BaseModel):
    """Service type breakdown item"""
    service_type: str
    count: int
    percentage: float


class ServiceBreakdownResponse(BaseModel):
    """Service type breakdown"""
    items: list[ServiceBreakdownItem]
    total: int


class PeakHourItem(BaseModel):
    """Peak hour data point"""
    hour: int
    count: int
    percentage: float


class PeakHoursResponse(BaseModel):
    """Peak hours analysis"""
    items: list[PeakHourItem]
    busiest_hour: int
    total_appointments: int


class PatientTypeItem(BaseModel):
    """Patient type distribution item"""
    pet_type: str
    count: int
    percentage: float


class PatientTypeResponse(BaseModel):
    """Patient type distribution"""
    items: list[PatientTypeItem]
    total: int


class RevenueServiceItem(BaseModel):
    """Revenue of completed visits for one service name"""
    service_type: str
    count: int
    revenue: float


class RevenueMonthItem(BaseModel):
    """Revenue of completed visits in one calendar month (YYYY-MM)"""
    month: str
    count: int
    revenue: float


class RevenueResponse(BaseModel):
    """Revenue from completed visits (cancelled and unfinished ones excluded)"""
    total_revenue: float
    completed_count: int
    priced_count: int
    unpriced_count: int
    average_per_visit: float
    this_month_revenue: float
    this_month_count: int
    last_30_days_revenue: float
    last_30_days_count: int
    by_service: list[RevenueServiceItem]
    by_month: list[RevenueMonthItem]


class FullAnalyticsResponse(BaseModel):
    """Full analytics data"""
    dashboard: DashboardStatsResponse
    appointment_trends: AppointmentTrendResponse
    service_breakdown: ServiceBreakdownResponse
    peak_hours: PeakHoursResponse
    patient_types: PatientTypeResponse
    revenue: RevenueResponse


