"""
Main API router
Combines all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    vets,
    auth,
    vet_patients,
    vet_appointments,
    vet_reviews,
    vet_analytics,
    vet_notifications,
    vet_clients,
    vet_services,
    invite,
    owner,
    uploads,
    owner_chat,
    vet_chat,
    vet_reminders,
    owner_reminders,
    vet_documents,
    public,
)

# Create the main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(vets.router, prefix="/vets", tags=["Vets"])
api_router.include_router(vet_patients.router, prefix="/vet/patients", tags=["Vet Patients"])
api_router.include_router(vet_appointments.router, prefix="/vet/appointments", tags=["Vet Appointments"])
api_router.include_router(vet_reviews.router, prefix="/vet/reviews", tags=["Vet Reviews"])
api_router.include_router(vet_analytics.router, prefix="/vet", tags=["Vet Analytics"])
api_router.include_router(vet_notifications.router, prefix="/vet/notifications", tags=["Vet Notifications"])
api_router.include_router(vet_clients.router, prefix="/vet/clients", tags=["Vet Clients"])
api_router.include_router(vet_services.router, prefix="/vet/services", tags=["Vet Services"])
api_router.include_router(invite.router, prefix="/invite", tags=["Invite"])
api_router.include_router(owner.router, prefix="/owner", tags=["Pet Owner"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(owner_chat.router, prefix="/owner/chat", tags=["Owner Chat"])
api_router.include_router(vet_chat.router, prefix="/vet/chat", tags=["Vet Chat"])
api_router.include_router(vet_reminders.router, prefix="/vet/reminders", tags=["Vet Reminders"])
api_router.include_router(owner_reminders.router, prefix="/owner/reminders", tags=["Owner Reminders"])
api_router.include_router(vet_documents.router, prefix="/vet/documents", tags=["Vet Documents"])
api_router.include_router(public.router, prefix="/public", tags=["Public"])

@api_router.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Vetly API v1",
        "status": "active",
        "endpoints": {
            "health": "/health",
            "docs": "/api/v1/docs",
            "redoc": "/api/v1/redoc"
        }
    }
