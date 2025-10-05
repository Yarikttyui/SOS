"""
SOS Service - Business logic for SOS alerts
"""
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.models.sos_alert import SOSAlert, AlertStatus
from app.schemas.sos import SOSAlertCreate


async def create_sos_alert(
    db: Session,
    alert_data: SOSAlertCreate,
    user_id: UUID
) -> SOSAlert:
    """Create new SOS alert"""
    new_alert = SOSAlert(
        user_id=user_id,
        **alert_data.dict()
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    return new_alert


async def update_sos_status(
    db: Session,
    alert_id: UUID,
    status: AlertStatus,
    assigned_to: Optional[UUID] = None
) -> Optional[SOSAlert]:
    """Update SOS alert status"""
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    
    if not alert:
        return None
    
    alert.status = status
    if assigned_to:
        alert.assigned_to = assigned_to
    
    db.commit()
    db.refresh(alert)
    
    return alert


async def get_nearby_alerts(
    db: Session,
    latitude: float,
    longitude: float,
    radius_km: float = 50.0,
    limit: int = 10
):
    """Get nearby SOS alerts"""
    alerts = db.query(SOSAlert).filter(
        SOSAlert.status.in_([AlertStatus.PENDING, AlertStatus.ASSIGNED])
    ).limit(limit).all()
    
    return alerts
