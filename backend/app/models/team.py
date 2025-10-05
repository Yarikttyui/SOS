"""
Rescue Team model
"""
from sqlalchemy import Column, String, Enum as SQLEnum, JSON, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class TeamStatus(str, enum.Enum):
    """Team status"""
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"


class TeamType(str, enum.Enum):
    """Team type"""
    FIRE = "fire"
    MEDICAL = "medical"
    POLICE = "police"
    WATER_RESCUE = "water_rescue"
    MOUNTAIN_RESCUE = "mountain_rescue"
    SEARCH_RESCUE = "search_rescue"
    ECOLOGICAL = "ecological"
    MULTI_PURPOSE = "multi_purpose"


class RescueTeam(Base):
    """Rescue Team model"""
    __tablename__ = "rescue_teams"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # Simplified: use String instead of Enum
    status = Column(String(20), default="available")  # Simplified: use String instead of Enum
    
    current_latitude = Column(DECIMAL(10, 8))
    current_longitude = Column(DECIMAL(11, 8))
    
    members = Column(JSON)  # List of member IDs and roles
    leader_id = Column(String(36), nullable=True)  # Team leader user ID
    leader_name = Column(String(255), nullable=True)
    equipment = Column(JSON)  # List of available equipment
    contact_phone = Column(String(20))
    contact_email = Column(String(255))
    
    base_latitude = Column(DECIMAL(10, 8))
    base_longitude = Column(DECIMAL(11, 8))
    base_address = Column(String(500))
    
    capacity = Column(String(50))  # e.g., "5-10 человек"
    specialization = Column(JSON)  # List of specializations
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    alerts = relationship("SOSAlert", back_populates="team")
    
    def __repr__(self):
        return f"<RescueTeam {self.name} - {self.type} ({self.status})>"
