"""
Rescue Team schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.models.team import TeamStatus, TeamType


class RescueTeamBase(BaseModel):
    """Base rescue team schema"""
    name: str
    type: TeamType
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class RescueTeamCreate(RescueTeamBase):
    """Rescue team creation schema"""
    base_latitude: Optional[Decimal] = None
    base_longitude: Optional[Decimal] = None
    base_address: Optional[str] = None
    capacity: Optional[str] = None
    specialization: Optional[List[str]] = None
    member_ids: Optional[List[str]] = []  # List of rescuer user IDs
    leader_id: Optional[str] = None  # Team leader user ID


class RescueTeamUpdate(BaseModel):
    """Rescue team update schema"""
    name: Optional[str] = None
    status: Optional[TeamStatus] = None
    current_latitude: Optional[Decimal] = None
    current_longitude: Optional[Decimal] = None
    members: Optional[List[dict]] = None
    equipment: Optional[List[dict]] = None
    member_ids: Optional[List[str]] = None  # Update team members
    leader_id: Optional[str] = None  # Update team leader


class RescueTeamResponse(RescueTeamBase):
    """Rescue team response schema"""
    id: UUID
    status: TeamStatus
    current_latitude: Optional[Decimal]
    current_longitude: Optional[Decimal]
    members: Optional[List[dict]]
    equipment: Optional[List[dict]]
    base_latitude: Optional[Decimal]
    base_longitude: Optional[Decimal]
    base_address: Optional[str]
    capacity: Optional[str]
    specialization: Optional[List[str]]
    leader_id: Optional[str] = None  # Team leader user ID
    leader_name: Optional[str] = None  # Team leader name
    member_count: Optional[int] = 0  # Number of team members
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
