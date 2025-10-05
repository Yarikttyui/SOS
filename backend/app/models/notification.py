"""
Notification model
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification types"""
    SOS_CREATED = "sos_created"
    SOS_ASSIGNED = "sos_assigned"
    SOS_UPDATED = "sos_updated"
    SOS_COMPLETED = "sos_completed"
    TEAM_ASSIGNED = "team_assigned"
    SYSTEM = "system"
    WARNING = "warning"
    INFO = "info"


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    type = Column(String(20), nullable=False)  # Simplified: use String instead of Enum
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    alert_id = Column(String(36))
    team_id = Column(String(36))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_at = Column(DateTime)
    
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.id} - {self.type} (read: {self.is_read})>"
