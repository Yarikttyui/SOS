"""
Analytics endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.sos_alert import SOSAlert, EmergencyType, AlertStatus

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics (operators and admins only)"""
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Total counts
    total_alerts = db.query(SOSAlert).count()
    active_alerts = db.query(SOSAlert).filter(
        SOSAlert.status.in_([AlertStatus.PENDING.value, AlertStatus.ASSIGNED.value, AlertStatus.IN_PROGRESS.value])
    ).count()
    
    # Today's alerts
    today = datetime.utcnow().date()
    today_alerts = db.query(SOSAlert).filter(
        func.date(SOSAlert.created_at) == today
    ).count()
    
    # By status
    status_counts = db.query(
        SOSAlert.status,
        func.count(SOSAlert.id)
    ).group_by(SOSAlert.status).all()
    
    # By type
    type_counts = db.query(
        SOSAlert.type,
        func.count(SOSAlert.id)
    ).group_by(SOSAlert.type).all()
    
    return {
        "total_alerts": total_alerts,
        "active_alerts": active_alerts,
        "today_alerts": today_alerts,
        "by_status": {status: count for status, count in status_counts},
        "by_type": {type_: count for type_, count in type_counts}
    }


@router.get("/reports/daily")
async def get_daily_report(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get daily report for last N days"""
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    daily_counts = db.query(
        func.date(SOSAlert.created_at).label('date'),
        func.count(SOSAlert.id).label('count')
    ).filter(
        SOSAlert.created_at >= start_date
    ).group_by(
        func.date(SOSAlert.created_at)
    ).all()
    
    return {
        "period": f"Last {days} days",
        "data": [{"date": str(date), "count": count} for date, count in daily_counts]
    }


@router.get("/reports/response-time")
async def get_response_time_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get average response time statistics"""
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate average time from creation to assignment
    alerts_with_assignment = db.query(SOSAlert).filter(
        SOSAlert.assigned_at.isnot(None)
    ).all()
    
    if not alerts_with_assignment:
        return {"average_response_time_minutes": 0, "total_processed": 0}
    
    total_time = sum([
        (alert.assigned_at - alert.created_at).total_seconds()
        for alert in alerts_with_assignment
    ])
    
    avg_seconds = total_time / len(alerts_with_assignment)
    avg_minutes = avg_seconds / 60
    
    return {
        "average_response_time_minutes": round(avg_minutes, 2),
        "total_processed": len(alerts_with_assignment)
    }
