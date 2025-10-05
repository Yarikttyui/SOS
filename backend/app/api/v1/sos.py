"""
SOS Alert endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import asyncio

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.sos_alert import SOSAlert, AlertStatus
from app.models.team import RescueTeam
from app.schemas.sos import (
    SOSAlertCreate,
    SOSAlertUpdate,
    SOSAlertResponse,
    VoiceAnalysisRequest,
    ImageAnalysisRequest
)
from app.services.ai.voice import VoiceAssistant
from app.services.ai.image import ImageAnalyzer
from app.services.sos_service import create_sos_alert, update_sos_status
from app.services.notification_service import send_notification
from app.api.v1.websocket import send_alert_to_user, send_alert_update_to_user

router = APIRouter()


def enrich_alert_with_names(alert: SOSAlert, db: Session) -> dict:
    """Добавляет имена спасателя и бригады к объекту алерта"""
    alert_dict = {
        "id": alert.id,
        "user_id": alert.user_id,
        "type": alert.type,
        "status": alert.status,
        "priority": alert.priority,
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "address": alert.address,
        "title": alert.title,
        "description": alert.description,
        "media_urls": alert.media_urls,
        "ai_analysis": alert.ai_analysis,
        "assigned_to": alert.assigned_to,
        "team_id": alert.team_id,
        "created_at": alert.created_at,
        "updated_at": alert.updated_at,
        "assigned_at": alert.assigned_at,
        "completed_at": alert.completed_at,
        "assigned_to_name": None,
        "team_name": None
    }
    
    if alert.assigned_to:
        rescuer = db.query(User).filter(User.id == str(alert.assigned_to)).first()
        if rescuer:
            alert_dict["assigned_to_name"] = rescuer.full_name or rescuer.email
    
    if alert.team_id:
        team = db.query(RescueTeam).filter(RescueTeam.id == str(alert.team_id)).first()
        if team:
            alert_dict["team_name"] = team.name
    
    return alert_dict


@router.post("/", response_model=SOSAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: SOSAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new SOS alert
    
    - **type**: Type of emergency
    - **latitude**: Location latitude
    - **longitude**: Location longitude
    - **description**: Description of emergency
    """
    new_alert = SOSAlert(
        user_id=current_user.id,
        type=alert_data.type.value if hasattr(alert_data.type, 'value') else str(alert_data.type),
        latitude=alert_data.latitude,
        longitude=alert_data.longitude,
        title=alert_data.title,
        description=alert_data.description,
        address=alert_data.address,
        media_urls=alert_data.media_urls
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    alert_type_value = alert_data.type.value if hasattr(alert_data.type, 'value') else str(alert_data.type)
    await send_notification(
        db=db,
        user_id=current_user.id,
        title="SOS Alert Created",
        message=f"New {alert_type_value} alert created",
        alert_id=new_alert.id
    )
    
    return enrich_alert_with_names(new_alert, db)


@router.get("/", response_model=List[SOSAlertResponse])
async def get_alerts(
    status: Optional[str] = None,
    type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of SOS alerts
    
    Filters based on user role:
    - Citizens see their own alerts
    - Rescuers see assigned alerts
    - Operators/Admins see all alerts
    """
    query = db.query(SOSAlert)
    
    if current_user.role == "citizen":
        query = query.filter(SOSAlert.user_id == current_user.id)
    elif current_user.role == "rescuer":
        filters = []
        
        if current_user.team_id:
            filters.append(SOSAlert.team_id == current_user.team_id)
        
        filters.append(
            (SOSAlert.assigned_to == current_user.id) & 
            (SOSAlert.team_id == None)
        )
        
        filters.append(
            (SOSAlert.status == AlertStatus.ASSIGNED.value) & 
            (SOSAlert.assigned_to == None) & 
            (SOSAlert.team_id == None)
        )
        
        from sqlalchemy import or_
        query = query.filter(or_(*filters))
    
    if status:
        query = query.filter(SOSAlert.status == status)
    if type:
        query = query.filter(SOSAlert.type == type)
    
    alerts = query.order_by(SOSAlert.created_at.desc()).offset(skip).limit(limit).all()
    
    enriched_alerts = [enrich_alert_with_names(alert, db) for alert in alerts]
    return enriched_alerts


@router.get("/{alert_id}", response_model=SOSAlertResponse)
async def get_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific SOS alert by ID"""
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    if current_user.role == "citizen" and alert.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this alert"
        )
    
    return enrich_alert_with_names(alert, db)


@router.patch("/{alert_id}", response_model=SOSAlertResponse)
async def update_alert(
    alert_id: str,
    alert_update: SOSAlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update SOS alert
    
    Operators/Admins can update any field
    Rescuers can only update status and accept assigned alerts
    """
    if current_user.role not in ["operator", "admin", "rescuer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update alerts"
        )
    
    alert = db.query(SOSAlert).filter(SOSAlert.id == str(alert_id)).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    if current_user.role == "rescuer":
        if not current_user.is_team_leader:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only team leaders can accept and manage alerts"
            )
        
        if alert.status == AlertStatus.ASSIGNED.value and alert.assigned_to is None:
            if alert.team_id and alert.team_id != current_user.team_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This alert is assigned to another team"
                )
            
            alert.status = AlertStatus.IN_PROGRESS.value
            alert.assigned_to = current_user.id
            if not alert.team_id:  # Assign team if not already assigned
                alert.team_id = current_user.team_id
            alert.assigned_at = datetime.utcnow()
        elif alert.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this alert"
            )
        else:
            if alert_update.status:
                if alert_update.status == AlertStatus.COMPLETED:
                    alert.status = alert_update.status.value if hasattr(alert_update.status, 'value') else str(alert_update.status)
                    alert.completed_at = datetime.utcnow()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Team leader can only complete alerts"
                    )
    else:
        if alert_update.status:
            if alert_update.status == AlertStatus.ASSIGNED and alert.status == AlertStatus.PENDING.value:
                alert.status = AlertStatus.ASSIGNED.value
                alert.assigned_at = datetime.utcnow()
            elif alert_update.status == AlertStatus.CANCELLED:
                alert.status = AlertStatus.CANCELLED.value
            elif alert_update.status == AlertStatus.COMPLETED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only rescuers can complete alerts"
                )
            else:
                alert.status = alert_update.status.value if hasattr(alert_update.status, 'value') else str(alert_update.status)
        
        if alert_update.priority is not None:
            alert.priority = alert_update.priority
        if alert_update.assigned_to:
            alert.assigned_to = alert_update.assigned_to
        if alert_update.team_id:
            alert.team_id = alert_update.team_id
        if alert_update.description:
            alert.description = alert_update.description
    
    alert.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    
    if alert.status == AlertStatus.ASSIGNED.value and alert.team_id:
        print(f"🚨 Sending WebSocket notification to team {alert.team_id}")
        team_members = db.query(User).filter(User.team_id == alert.team_id).all()
        print(f"📋 Found {len(team_members)} team members")
        
        alert_data = enrich_alert_with_names(alert, db)
        
        for member in team_members:
            print(f"📤 Sending notification to user {member.id} ({member.email})")
            asyncio.create_task(send_alert_to_user(str(member.id), alert_data))
    
    elif alert.assigned_to:
        print(f"📤 Sending WebSocket update to user {alert.assigned_to}")
        alert_data = enrich_alert_with_names(alert, db)
        asyncio.create_task(send_alert_update_to_user(str(alert.assigned_to), alert_data))
    else:
        print(f"ℹ️ No WebSocket notification sent. Status: {alert.status}, team_id: {alert.team_id}, assigned_to: {alert.assigned_to}")
    
    return enrich_alert_with_names(alert, db)


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete SOS alert
    
    Only admins can delete alerts
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete alerts"
        )
    
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"}


@router.post("/analyze/voice")
async def analyze_voice(
    request: VoiceAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze voice message and extract emergency information
    
    - **audio_base64**: Base64 encoded audio file
    - **language**: Language code (default: ru)
    """
    voice_assistant = VoiceAssistant()
    
    try:
        analysis = await voice_assistant.analyze_emergency_audio(
            audio_base64=request.audio_base64,
            language=request.language
        )
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice analysis failed: {str(e)}"
        )


@router.post("/analyze/image")
async def analyze_image(
    request: ImageAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze image and identify emergency situation
    
    - **image_base64**: Base64 encoded image
    - **emergency_type**: Expected type of emergency
    """
    image_analyzer = ImageAnalyzer()
    
    try:
        analysis = await image_analyzer.analyze_emergency_image(
            image_base64=request.image_base64,
            emergency_type=request.emergency_type
        )
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )


@router.get("/stats/summary")
async def get_stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summary statistics of SOS alerts"""
    if current_user.role not in ["operator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    total_alerts = db.query(SOSAlert).count()
    pending_alerts = db.query(SOSAlert).filter(SOSAlert.status == AlertStatus.PENDING.value).count()
    in_progress = db.query(SOSAlert).filter(SOSAlert.status == AlertStatus.IN_PROGRESS.value).count()
    completed = db.query(SOSAlert).filter(SOSAlert.status == AlertStatus.COMPLETED.value).count()
    
    return {
        "total": total_alerts,
        "pending": pending_alerts,
        "in_progress": in_progress,
        "completed": completed
    }
