"""
SOS Alert model
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, Enum as SQLEnum, ForeignKey, DECIMAL, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class EmergencyType(str, enum.Enum):
    """Emergency types"""
    FIRE = "fire"
    MEDICAL = "medical"
    POLICE = "police"
    WATER_RESCUE = "water_rescue"
    MOUNTAIN_RESCUE = "mountain_rescue"
    SEARCH_RESCUE = "search_rescue"
    ECOLOGICAL = "ecological"
    GENERAL = "general"


class AlertStatus(str, enum.Enum):
    """Alert status"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AlertPriority(int, enum.Enum):
    """Alert priority (1 - highest, 5 - lowest)"""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    INFO = 5


class SOSAlert(Base):
    """SOS Alert model"""
    __tablename__ = "sos_alerts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    type = Column(String(20), default="other", nullable=False)  # Simplified: use String instead of Enum
    status = Column(String(20), default="pending", nullable=False)  # Simplified: use String instead of Enum
    priority = Column(Integer, default=AlertPriority.MEDIUM.value)
    
    latitude = Column(DECIMAL(10, 8), nullable=False)
    longitude = Column(DECIMAL(11, 8), nullable=False)
    address = Column(Text)
    
    title = Column(String(255))
    description = Column(Text)
    media_urls = Column(JSON)  # List of uploaded media URLs
    ai_analysis = Column(JSON)  # AI analysis results
    
    assigned_to = Column(String(36), ForeignKey("users.id"))
    team_id = Column(String(36), ForeignKey("rescue_teams.id"))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    user = relationship("User", back_populates="sos_alerts", foreign_keys=[user_id])
    assigned_rescuer = relationship("User", back_populates="assigned_alerts", foreign_keys=[assigned_to])
    team = relationship("RescueTeam", back_populates="alerts")
    
    def __repr__(self):
        return f"<SOSAlert {self.id} - {self.type} ({self.status})>"
