"""
Analytics schemas for request/response validation
"""

from datetime import date
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    """Dashboard summary statistics"""
    total_patients: int
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


class FullAnalyticsResponse(BaseModel):
    """Full analytics data"""
    dashboard: DashboardStatsResponse
    appointment_trends: AppointmentTrendResponse
    service_breakdown: ServiceBreakdownResponse
    peak_hours: PeakHoursResponse
    patient_types: PatientTypeResponse


