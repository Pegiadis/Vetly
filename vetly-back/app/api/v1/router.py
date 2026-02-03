"""
Main API router
Combines all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import vets, auth, vet_patients

# Create the main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(vets.router, prefix="/vets", tags=["Vets"])
api_router.include_router(vet_patients.router, prefix="/vet/patients", tags=["Vet Patients"])

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
