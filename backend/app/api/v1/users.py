"""
User management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of users
    
    Operators, coordinators and admins can access
    """
    if current_user.role not in ["operator", "coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID"""
    # Users can view their own profile, operators/admins can view any
    if current_user.id != user_id and current_user.role not in ["operator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    user = db.query(User).filter(User.id == str(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user"""
    # Users can update their own profile, coordinators/admins can update any
    if current_user.id != user_id and current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    user = db.query(User).filter(User.id == str(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if user_update.email:
        user.email = user_update.email
    if user_update.phone:
        user.phone = user_update.phone
    if user_update.full_name:
        user.full_name = user_update.full_name
    
    # Coordinators and admins can update role, specialization, and is_active
    if current_user.role in ["coordinator", "admin"]:
        if user_update.role:
            user.role = user_update.role
        if user_update.is_active is not None:
            user.is_active = user_update.is_active
        if user_update.specialization is not None:
            if user.role == "rescuer":
                user.specialization = user_update.specialization
        if user_update.team_id is not None:
            user.team_id = user_update.team_id
        if user_update.is_team_leader is not None:
            user.is_team_leader = user_update.is_team_leader
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
