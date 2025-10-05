"""
Notification schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    """Base notification schema"""
    type: NotificationType
    title: str
    message: str


class NotificationCreate(NotificationBase):
    """Notification creation schema"""
    user_id: UUID
    alert_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class NotificationUpdate(BaseModel):
    """Notification update schema"""
    is_read: bool


class NotificationResponse(NotificationBase):
    """Notification response schema"""
    id: UUID
    user_id: UUID
    is_read: bool
    alert_id: Optional[UUID]
    team_id: Optional[UUID]
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True
