"""
Core configuration for Vetly API
Uses pydantic-settings for environment variable management
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings"""

    # Project
    PROJECT_NAME: str = "Vetly API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Per-address and per-user request limits (app/core/rate_limit.py).
    RATE_LIMIT_ENABLED: bool = True

    # Closed pilot: only these email addresses can register or use authenticated APIs.
    PILOT_MODE: bool = False
    PILOT_ALLOWED_EMAILS: List[str] = []

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # AI
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-5-5"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Email
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Vetly <noreply@vetly.gr>"
    EMAIL_NOTIFICATIONS_ENABLED: bool = False
    PUSH_NOTIFICATIONS_ENABLED: bool = False
    EXPO_ACCESS_TOKEN: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    EMAIL_VERIFY_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_EXPIRE_HOURS: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v


settings = Settings()
