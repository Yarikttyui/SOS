"""
User model
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles"""
    CITIZEN = "citizen"
    RESCUER = "rescuer"
    OPERATOR = "operator"
    COORDINATOR = "coordinator"
    ADMIN = "admin"


class RescuerSpecialization(str, enum.Enum):
    """Rescuer specializations"""
    FIREFIGHTER = "firefighter"  # Пожарный
    PARAMEDIC = "paramedic"  # Врач/Парамедик
    POLICE = "police"  # Полицейский
    WATER_RESCUE = "water_rescue"  # Спасатель на воде
    MOUNTAIN_RESCUE = "mountain_rescue"  # Горный спасатель
    SEARCH_RESCUE = "search_rescue"  # Поисковик
    TECHNICAL_RESCUE = "technical_rescue"  # Технический спасатель
    ECOLOGICAL = "ecological"  # Эколог


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="citizen", nullable=False)  # Simplified: use String instead of Enum
    full_name = Column(String(255))
    
    specialization = Column(String(50), nullable=True)  # Simplified: use String instead of Enum
    team_id = Column(String(36), nullable=True)  # ID бригады
    is_team_leader = Column(Boolean, default=False)  # Лидер бригады
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sos_alerts = relationship("SOSAlert", back_populates="user", foreign_keys="SOSAlert.user_id")
    assigned_alerts = relationship("SOSAlert", back_populates="assigned_rescuer", foreign_keys="SOSAlert.assigned_to")
    notifications = relationship("Notification", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
