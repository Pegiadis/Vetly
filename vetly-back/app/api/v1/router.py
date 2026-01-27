"""
Main API router
Combines all endpoint routers
"""

from fastapi import APIRouter

# Create the main API router
api_router = APIRouter()

# TODO: Include endpoint routers here as they're created
# Example:
# from app.api.v1.endpoints import auth, users, pets, vets
# api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(pets.router, prefix="/pets", tags=["Pets"])
# api_router.include_router(vets.router, prefix="/vets", tags=["Vets"])

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
