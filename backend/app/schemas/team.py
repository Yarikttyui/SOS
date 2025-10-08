"""
Rescue Team schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Union, Any
from datetime import datetime
from uuid import UUID

from app.models.team import TeamStatus, TeamType


class RescueTeamBase(BaseModel):
    """Base rescue team schema"""
    name: str
    type: TeamType
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class RescueTeamCreate(RescueTeamBase):
    """Rescue team creation schema"""
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None
    base_address: Optional[str] = None
    capacity: Optional[str] = None
    specialization: Optional[List[str]] = None
    member_ids: Optional[List[str]] = []  # List of rescuer user IDs
    leader_id: Optional[str] = None  # Team leader user ID


class RescueTeamUpdate(BaseModel):
    """Rescue team update schema"""
    name: Optional[str] = None
    status: Optional[TeamStatus] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    members: Optional[List[Any]] = None  # Может быть список строк или dict
    equipment: Optional[List[Any]] = None  # Может быть список строк или dict
    member_ids: Optional[List[str]] = None  # Update team members
    leader_id: Optional[str] = None  # Update team leader


class RescueTeamResponse(RescueTeamBase):
    """Rescue team response schema"""
    id: UUID
    status: TeamStatus
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    members: Optional[List[Any]]  # Может быть список строк или dict
    equipment: Optional[List[Any]]  # Может быть список строк или dict
    base_latitude: Optional[float]
    base_longitude: Optional[float]
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
