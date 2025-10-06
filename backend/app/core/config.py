"""
Application configuration settings
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import json
import os


class Settings(BaseSettings):
    """Application settings"""
    
    APP_NAME: str = "Rescue System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    DATABASE_URL: str = "mysql+pymysql://rescue_user:rescue_pass_2024_secure@localhost:3306/rescue_db?charset=utf8mb4"
    
    REDIS_URL: str = "redis://:rescue_redis_pass@localhost:6379/0"
    
    SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, List[str]]):
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("["):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return parsed
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")

    GIGACHAT_AUTH_KEY: str = os.getenv("GIGACHAT_AUTH_KEY", "")
    GIGACHAT_CLIENT_ID: str = os.getenv("GIGACHAT_CLIENT_ID", "")
    GIGACHAT_CLIENT_SECRET: str = os.getenv("GIGACHAT_CLIENT_SECRET", "")
    GIGACHAT_BASE_URL: str = os.getenv("GIGACHAT_BASE_URL", "https://gigachat.devices.sberbank.ru/api/v1")
    GIGACHAT_AUTH_URL: str = os.getenv("GIGACHAT_AUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2")
    GIGACHAT_SCOPE: str = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
    GIGACHAT_MODEL: str = os.getenv("GIGACHAT_MODEL", "GigaChat-2")
    GIGACHAT_VERIFY_SSL: bool = os.getenv("GIGACHAT_VERIFY_SSL", "false").lower() in {"1", "true", "yes"}
    
    MAPBOX_ACCESS_TOKEN: str = "your_mapbox_token_here"
    
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "noreply@rescue-system.ru"
    SMTP_PASSWORD: str = "your_email_password"
    EMAIL_FROM: str = "noreply@rescue-system.ru"
    
    SMS_API_KEY: str = "your_sms_api_key"
    SMS_API_URL: str = "https://sms-api.example.com"
    
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    DEFAULT_LATITUDE: float = 56.8587
    DEFAULT_LONGITUDE: float = 35.9176
    DEFAULT_ZOOM: int = 12
    
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = 'allow'  # Разрешить дополнительные поля из .env


settings = Settings()

if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)

if not os.path.exists("logs"):
    os.makedirs("logs")
