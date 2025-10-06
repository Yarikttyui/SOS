"""
SOS Alert schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.models.sos_alert import EmergencyType, AlertStatus, AlertPriority


class SOSAlertBase(BaseModel):
    """Base SOS alert schema"""
    type: EmergencyType
    latitude: Decimal = Field(..., ge=-90, le=90)
    longitude: Decimal = Field(..., ge=-180, le=180)
    title: Optional[str] = None
    description: Optional[str] = None


class SOSAlertCreate(SOSAlertBase):
    """SOS alert creation schema"""
    address: Optional[str] = None
    media_urls: Optional[List[str]] = None


class SOSAlertUpdate(BaseModel):
    """SOS alert update schema"""
    status: Optional[AlertStatus] = None
    priority: Optional[int] = None
    assigned_to: Optional[UUID] = None
    team_id: Optional[UUID] = None
    description: Optional[str] = None


class SOSAlertResponse(SOSAlertBase):
    """SOS alert response schema"""
    id: UUID
    user_id: UUID
    status: AlertStatus
    priority: int
    address: Optional[str]
    media_urls: Optional[List[str]]
    ai_analysis: Optional[dict]
    assigned_to: Optional[UUID]
    team_id: Optional[UUID]
    assigned_to_name: Optional[str] = None  # Имя спасателя
    team_name: Optional[str] = None  # Название бригады
    created_at: datetime
    updated_at: datetime
    assigned_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class VoiceAnalysisRequest(BaseModel):
    """Voice analysis request schema"""
    audio_base64: str
    language: str = "ru"
    mime_type: Optional[str] = None


class ImageAnalysisRequest(BaseModel):
    """Image analysis request schema"""
    image_base64: str
    emergency_type: EmergencyType


class AIAnalysisResponse(BaseModel):
    """AI analysis response schema"""
    emergency_type: EmergencyType
    priority: AlertPriority
    description: str
    recommendations: List[str]
    confidence: float
