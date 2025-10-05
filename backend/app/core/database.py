"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Database URL from settings
database_url = settings.DATABASE_URL

# MySQL connection args
connect_args = {}
if database_url.startswith("mysql"):
    connect_args = {
        "charset": "utf8mb4",
        "use_unicode": True
    }
elif database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine
sync_engine = create_engine(
    database_url,
    connect_args=connect_args,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # Enable connection health checks
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency для получения DB сессии
    
    Yields:
        Session: Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
