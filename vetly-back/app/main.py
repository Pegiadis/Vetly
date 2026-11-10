"""
Vetly Backend API - Main Application Entry Point
FastAPI application configuration and startup
"""

import logging
import sys

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.core.deps import get_db
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router
from app.utils.upload import UPLOAD_DIR, ensure_upload_dir

# Uvicorn only configures its own loggers; without a root handler, application
# loggers (logging.getLogger(__name__)) drop everything below WARNING.
logging.basicConfig(
    level=settings.LOG_LEVEL.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        send_default_pii=False,
        include_local_variables=False,
        max_request_body_size="never",
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        integrations=[StarletteIntegration(), FastApiIntegration()],
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Vetly API")
    logger.info("Environment: %s", settings.ENVIRONMENT)
    logger.info("Database: %s", settings.DATABASE_URL.split("@")[-1])
    logger.info("Email provider: %s", settings.effective_email_provider)
    logger.info("Error monitoring: %s", "sentry" if settings.SENTRY_DSN else "off")
    ensure_upload_dir()

    yield

    # Shutdown
    logger.info("Shutting down Vetly API")


_is_production = settings.ENVIRONMENT == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Veterinary Care Platform API - Connecting pet owners with veterinary services",
    version=settings.VERSION,
    openapi_url=None if _is_production else f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if _is_production else f"{settings.API_V1_STR}/docs",
    redoc_url=None if _is_production else f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🐾 Welcome to Vetly API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Readiness includes the database, unlike the liveness endpoint."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(503, "Database unavailable") from None
    return {"status": "ready"}
