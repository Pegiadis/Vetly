"""
Vet Dashboard & Analytics API endpoints
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.analytics import AnalyticsService
from app.schemas.analytics import (
    DashboardStatsResponse,
    FullAnalyticsResponse,
    AppointmentTrendResponse,
    ServiceBreakdownResponse,
    PeakHoursResponse,
    PatientTypeResponse,
    RevenueStatsResponse,
    RevenueByServiceResponse,
)

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> DashboardStatsResponse:
    """Get dashboard summary statistics"""
    service = AnalyticsService(db)
    return service.get_dashboard_stats(vet_id=current_vet.id)


@router.get("/analytics", response_model=FullAnalyticsResponse)
def get_full_analytics(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> FullAnalyticsResponse:
    """Get full analytics data"""
    service = AnalyticsService(db)
    return service.get_full_analytics(vet_id=current_vet.id)


@router.get("/analytics/appointments", response_model=AppointmentTrendResponse)
def get_appointment_trends(
    days: int = Query(30, ge=7, le=365, description="Number of days to analyze"),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> AppointmentTrendResponse:
    """Get appointment trends over time"""
    service = AnalyticsService(db)
    return service.get_appointment_trends(vet_id=current_vet.id, days=days)


@router.get("/analytics/services", response_model=ServiceBreakdownResponse)
def get_service_breakdown(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> ServiceBreakdownResponse:
    """Get service type breakdown"""
    service = AnalyticsService(db)
    return service.get_service_breakdown(vet_id=current_vet.id)


@router.get("/analytics/peak-hours", response_model=PeakHoursResponse)
def get_peak_hours(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> PeakHoursResponse:
    """Get peak hours analysis"""
    service = AnalyticsService(db)
    return service.get_peak_hours(vet_id=current_vet.id)


@router.get("/analytics/patient-types", response_model=PatientTypeResponse)
def get_patient_types(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> PatientTypeResponse:
    """Get patient type distribution"""
    service = AnalyticsService(db)
    return service.get_patient_types(vet_id=current_vet.id)


@router.get("/analytics/revenue", response_model=RevenueStatsResponse)
def get_revenue_stats(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> RevenueStatsResponse:
    """Get revenue statistics for the vet"""
    service = AnalyticsService(db)
    return service.get_revenue_stats(vet_id=current_vet.id)


@router.get("/analytics/revenue/by-service", response_model=RevenueByServiceResponse)
def get_revenue_by_service(
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> RevenueByServiceResponse:
    """Get revenue breakdown by service type"""
    service = AnalyticsService(db)
    return service.get_revenue_by_service(vet_id=current_vet.id)
