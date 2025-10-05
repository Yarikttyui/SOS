"""
Notification Service
"""
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.models.notification import Notification, NotificationType


async def send_notification(
    db: Session,
    user_id: UUID,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    alert_id: Optional[UUID] = None,
    team_id: Optional[UUID] = None
) -> Notification:
    """
    Send notification to user
    
    Args:
        db: Database session
        user_id: Target user ID
        title: Notification title
        message: Notification message
        type: Notification type
        alert_id: Related alert ID
        team_id: Related team ID
        
    Returns:
        Notification: Created notification
    """
    notification = Notification(
        user_id=user_id,
        type=type.value if hasattr(type, 'value') else str(type),
        title=title,
        message=message,
        alert_id=alert_id,
        team_id=team_id
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    
    return notification


async def send_email(to: str, subject: str, body: str):
    """
    Send email notification (stub)
    
    In production: integrate with SMTP or email service
    """
    print(f"[EMAIL] To: {to}, Subject: {subject}, Body: {body}")
    pass


async def send_sms(phone: str, message: str):
    """
    Send SMS notification (stub)
    
    In production: integrate with SMS gateway
    """
    print(f"[SMS] To: {phone}, Message: {message}")
    pass
