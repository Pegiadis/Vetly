"""
Vetly Backend API - Main Application Entry Point
FastAPI application configuration and startup
"""

import logging
import re
import sys
import uuid

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.core.deps import get_db
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router
from app.core.uploads import MAX_UPLOAD_BYTES, declared_length_too_large, too_large_message
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

# Request id, early upload size rejection, generic 500 and security headers.
# Registered before CORS so CORS wraps it and error responses keep their CORS
# headers (otherwise the browser reports a 500 as a network error).
_UPLOAD_PATH_RE = re.compile(r"^/api/v1/uploads/")


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    request.state.request_id = request_id

    if request.method == "POST" and _UPLOAD_PATH_RE.match(request.url.path):
        if declared_length_too_large(request.headers.get("content-length")):
            response = JSONResponse(
                status_code=413,
                content={"detail": too_large_message(MAX_UPLOAD_BYTES)},
            )
            response.headers["X-Request-ID"] = request_id
            return response

    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception(
            "Unhandled error [request_id=%s] %s %s", request_id, request.method, request.url.path
        )
        if settings.SENTRY_DSN:
            import sentry_sdk

            sentry_sdk.capture_exception(exc)
        response = JSONResponse(
            status_code=500,
            content={
                "detail": f"Παρουσιάστηκε μη αναμενόμενο σφάλμα. Δοκιμάστε ξανά. (κωδικός: {request_id})",
                "request_id": request_id,
            },
        )

    response.headers["X-Request-ID"] = request_id
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if (
        request.url.path.startswith(settings.API_V1_STR)
        and request.headers.get("authorization")
        and "cache-control" not in response.headers
    ):
        response.headers["Cache-Control"] = "no-store"
    return response


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

# Serve uploaded files. The mount checks the directory at import time, before
# the startup hook runs, so a fresh checkout or server needs it created here.
ensure_upload_dir()
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
