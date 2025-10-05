"""
User schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    phone: Optional[str] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=72)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None  # Changed from UserRole enum to str
    is_active: Optional[bool] = None
    specialization: Optional[str] = None  # Changed from RescuerSpecialization enum to str
    team_id: Optional[str] = None
    is_team_leader: Optional[bool] = None


class UserResponse(UserBase):
    """User response schema"""
    id: str
    role: str  # Changed from UserRole enum to str
    is_active: bool
    is_verified: bool
    specialization: Optional[str] = None  # Changed from RescuerSpecialization enum to str
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    is_team_leader: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[Dict[str, Any]] = None


class TokenData(BaseModel):
    """Token payload schema"""
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None  # Changed from UserRole enum to str
