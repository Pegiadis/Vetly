"""
Core configuration for Vetly API
Uses pydantic-settings for environment variable management
"""

import logging
from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator

logger = logging.getLogger(__name__)

# Value shipped in .env.example; must never sign production tokens.
SECRET_KEY_PLACEHOLDER = "change-this-to-a-random-string-in-production"
MIN_SECRET_KEY_LENGTH = 32


class Settings(BaseSettings):
    """Application settings"""

    # Project
    PROJECT_NAME: str = "Vetly API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Error monitoring (Sentry). Empty disables it.
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.0

    # Per-address and per-user request limits (app/core/rate_limit.py).
    RATE_LIMIT_ENABLED: bool = True

    # Vets with these emails (comma-separated) can approve new clinics. Empty: nobody.
    ADMIN_EMAILS: str = ""

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

    # Email transport. EMAIL_PROVIDER left unset keeps the historical behaviour:
    # Resend when RESEND_API_KEY is set, otherwise console (nothing is sent).
    EMAIL_PROVIDER: Literal["", "smtp", "resend", "console"] = ""
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Vetly <noreply@vetly.gr>"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_SECURITY: Literal["starttls", "ssl", "none"] = "starttls"
    SMTP_TIMEOUT_SECONDS: float = 10.0
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

    @field_validator("EMAIL_PROVIDER", "SMTP_SECURITY", mode="before")
    @classmethod
    def normalize_choice(cls, v):
        """Accept any letter case and surrounding whitespace in choice settings."""
        return v.strip().lower() if isinstance(v, str) else v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def effective_email_provider(self) -> str:
        """The transport in use: the explicit choice, else Resend if keyed, else console."""
        if self.EMAIL_PROVIDER:
            return self.EMAIL_PROVIDER
        return "resend" if self.RESEND_API_KEY else "console"

    @model_validator(mode="after")
    def validate_runtime_settings(self):
        """Refuse unsafe production configuration at startup; warn in development."""
        weak_key = (
            len(self.SECRET_KEY) < MIN_SECRET_KEY_LENGTH
            or self.SECRET_KEY == SECRET_KEY_PLACEHOLDER
        )
        if weak_key and not self.is_production:
            logger.warning(
                "SECRET_KEY is shorter than %d characters or the example placeholder; "
                "production refuses to start with it.",
                MIN_SECRET_KEY_LENGTH,
            )

        if not self.is_production:
            return self

        problems = []
        if weak_key:
            problems.append(
                f"SECRET_KEY must be at least {MIN_SECRET_KEY_LENGTH} characters and not the "
                "example placeholder (generate one with: openssl rand -hex 32)"
            )
        provider = self.effective_email_provider
        if provider == "smtp":
            if not self.SMTP_HOST:
                problems.append("EMAIL_PROVIDER=smtp requires SMTP_HOST")
            if bool(self.SMTP_USERNAME) != bool(self.SMTP_PASSWORD):
                problems.append("SMTP_USERNAME and SMTP_PASSWORD must be set together")
            if self.SMTP_USERNAME and self.SMTP_SECURITY == "none":
                problems.append(
                    "SMTP credentials require SMTP_SECURITY=starttls or ssl "
                    "(they would be sent unencrypted)"
                )
        elif provider == "resend" and not self.RESEND_API_KEY:
            problems.append("EMAIL_PROVIDER=resend requires RESEND_API_KEY")
        if problems:
            raise ValueError("Invalid production configuration: " + "; ".join(problems))
        return self


settings = Settings()
