import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "ScholarAI"
    API_V1_STR: str = "/api"
    
    # Security
    # In production, this should be a strong random secret key
    SECRET_KEY: str = os.getenv("SECRET_KEY", "scholarai_super_secret_key_change_me_in_production_1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Default to SQLite local database file
    # If running on Vercel and SQLite is used, redirect it to /tmp to avoid read-only errors
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:////tmp/scholarai.db" if os.getenv("VERCEL") == "1" else "sqlite:///./scholarai.db"
    )
    
    # File Storage
    # On Vercel (Linux, read-only filesystem), redirect uploads to /tmp
    # VERCEL env var is set to '1' on Vercel's servers
    _on_vercel = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        "/tmp/uploads" if _on_vercel else "./uploads"
    )
    
    # AI Config
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
