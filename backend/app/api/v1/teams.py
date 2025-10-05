"""
Rescue Teams endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.team import RescueTeam
from app.schemas.team import RescueTeamCreate, RescueTeamUpdate, RescueTeamResponse

router = APIRouter()


@router.post("/", response_model=RescueTeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: RescueTeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new rescue team (coordinator/admin only)"""
    if current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Only coordinators and admins can create teams."
        )
    
    # Validate leader exists and is a rescuer
    if team_data.leader_id:
        leader = db.query(User).filter(User.id == team_data.leader_id).first()
        if not leader:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leader not found"
            )
        if leader.role != "rescuer":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leader must be a rescuer"
            )
    
    # Create team
    new_team = RescueTeam(
        name=team_data.name,
        type=team_data.type,
        leader_id=team_data.leader_id,
        contact_phone=team_data.contact_phone,
        contact_email=team_data.contact_email,
        base_latitude=team_data.base_latitude,
        base_longitude=team_data.base_longitude,
        base_address=team_data.base_address,
        capacity=team_data.capacity,
        specialization=team_data.specialization,
        members=[]
    )
    
    db.add(new_team)
    db.flush()  # Get team ID before updating users
    
    # Update team members
    if team_data.member_ids:
        members_list = []
        for member_id in team_data.member_ids:
            member = db.query(User).filter(User.id == member_id).first()
            if member and member.role == "rescuer":
                member.team_id = new_team.id
                member.is_team_leader = (member_id == team_data.leader_id)
                members_list.append({
                    "user_id": member_id,
                    "name": member.full_name or member.email,
                    "specialization": member.specialization if member.specialization else None
                })
        new_team.members = members_list
    
    db.commit()
    db.refresh(new_team)
    
    # Enrich response with leader name
    response_dict = {
        "id": new_team.id,
        "name": new_team.name,
        "type": new_team.type,
        "status": new_team.status,
        "current_latitude": new_team.current_latitude,
        "current_longitude": new_team.current_longitude,
        "members": new_team.members,
        "equipment": new_team.equipment,
        "base_latitude": new_team.base_latitude,
        "base_longitude": new_team.base_longitude,
        "base_address": new_team.base_address,
        "capacity": new_team.capacity,
        "specialization": new_team.specialization,
        "leader_id": new_team.leader_id,
        "leader_name": None,
        "member_count": len(new_team.members) if new_team.members else 0,
        "contact_phone": new_team.contact_phone,
        "contact_email": new_team.contact_email,
        "created_at": new_team.created_at,
        "updated_at": new_team.updated_at
    }
    
    if new_team.leader_id:
        leader = db.query(User).filter(User.id == new_team.leader_id).first()
        if leader:
            response_dict["leader_name"] = leader.full_name or leader.email
    
    return response_dict


@router.get("/", response_model=List[RescueTeamResponse])
async def get_teams(
    status: str = None,
    type: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of rescue teams"""
    query = db.query(RescueTeam)
    
    if status:
        query = query.filter(RescueTeam.status == status)
    if type:
        query = query.filter(RescueTeam.type == type)
    
    teams = query.offset(skip).limit(limit).all()
    
    # Enrich with leader names
    enriched_teams = []
    for team in teams:
        team_dict = {
            "id": team.id,
            "name": team.name,
            "type": team.type,
            "status": team.status,
            "current_latitude": team.current_latitude,
            "current_longitude": team.current_longitude,
            "members": team.members,
            "equipment": team.equipment,
            "base_latitude": team.base_latitude,
            "base_longitude": team.base_longitude,
            "base_address": team.base_address,
            "capacity": team.capacity,
            "specialization": team.specialization,
            "leader_id": team.leader_id,
            "leader_name": None,
            "member_count": len(team.members) if team.members else 0,
            "contact_phone": team.contact_phone,
            "contact_email": team.contact_email,
            "created_at": team.created_at,
            "updated_at": team.updated_at
        }
        
        if team.leader_id:
            leader = db.query(User).filter(User.id == team.leader_id).first()
            if leader:
                team_dict["leader_name"] = leader.full_name or leader.email
        
        enriched_teams.append(team_dict)
    
    return enriched_teams


@router.get("/{team_id}", response_model=RescueTeamResponse)
async def get_team(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get team by ID"""
    team = db.query(RescueTeam).filter(RescueTeam.id == str(team_id)).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Enrich with leader name
    team_dict = {
        "id": team.id,
        "name": team.name,
        "type": team.type,
        "status": team.status,
        "current_latitude": team.current_latitude,
        "current_longitude": team.current_longitude,
        "members": team.members,
        "equipment": team.equipment,
        "base_latitude": team.base_latitude,
        "base_longitude": team.base_longitude,
        "base_address": team.base_address,
        "capacity": team.capacity,
        "specialization": team.specialization,
        "leader_id": team.leader_id,
        "leader_name": None,
        "member_count": len(team.members) if team.members else 0,
        "contact_phone": team.contact_phone,
        "contact_email": team.contact_email,
        "created_at": team.created_at,
        "updated_at": team.updated_at
    }
    
    if team.leader_id:
        leader = db.query(User).filter(User.id == team.leader_id).first()
        if leader:
            team_dict["leader_name"] = leader.full_name or leader.email
    
    return team_dict


@router.patch("/{team_id}", response_model=RescueTeamResponse)
async def update_team(
    team_id: str,
    team_update: RescueTeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update team (coordinator/operators/admins)"""
    if current_user.role not in ["coordinator", "operator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    team = db.query(RescueTeam).filter(RescueTeam.id == str(team_id)).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Update fields
    if team_update.name:
        team.name = team_update.name
    if team_update.status:
        team.status = team_update.status
    if team_update.current_latitude is not None:
        team.current_latitude = team_update.current_latitude
    if team_update.current_longitude is not None:
        team.current_longitude = team_update.current_longitude
    if team_update.equipment:
        team.equipment = team_update.equipment
    
    # Update leader (coordinator/admin only)
    if team_update.leader_id and current_user.role in ["coordinator", "admin"]:
        leader = db.query(User).filter(User.id == team_update.leader_id).first()
        if not leader or leader.role != "rescuer":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid leader"
            )
        # Remove old leader status
        if team.leader_id:
            old_leader = db.query(User).filter(User.id == team.leader_id).first()
            if old_leader:
                old_leader.is_team_leader = False
        # Set new leader
        team.leader_id = team_update.leader_id
        leader.is_team_leader = True
        leader.team_id = team.id
    
    # Update members (coordinator/admin only)
    if team_update.member_ids is not None and current_user.role in ["coordinator", "admin"]:
        # Remove old members from team
        old_members = db.query(User).filter(User.team_id == team.id).all()
        for member in old_members:
            member.team_id = None
            member.is_team_leader = False
        
        # Add new members
        members_list = []
        for member_id in team_update.member_ids:
            member = db.query(User).filter(User.id == member_id).first()
            if member and member.role == "rescuer":
                member.team_id = team.id
                member.is_team_leader = (member_id == team.leader_id)
                members_list.append({
                    "user_id": member_id,
                    "name": member.full_name or member.email,
                    "specialization": member.specialization if member.specialization else None
                })
        team.members = members_list
    elif team_update.members:
        team.members = team_update.members
    
    db.commit()
    db.refresh(team)
    
    # Enrich response
    response_dict = {
        "id": team.id,
        "name": team.name,
        "type": team.type,
        "status": team.status,
        "current_latitude": team.current_latitude,
        "current_longitude": team.current_longitude,
        "members": team.members,
        "equipment": team.equipment,
        "base_latitude": team.base_latitude,
        "base_longitude": team.base_longitude,
        "base_address": team.base_address,
        "capacity": team.capacity,
        "specialization": team.specialization,
        "leader_id": team.leader_id,
        "leader_name": None,
        "member_count": len(team.members) if team.members else 0,
        "contact_phone": team.contact_phone,
        "contact_email": team.contact_email,
        "created_at": team.created_at,
        "updated_at": team.updated_at
    }
    
    if team.leader_id:
        leader = db.query(User).filter(User.id == team.leader_id).first()
        if leader:
            response_dict["leader_name"] = leader.full_name or leader.email
    
    return response_dict


@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete team (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    team = db.query(RescueTeam).filter(RescueTeam.id == str(team_id)).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    db.delete(team)
    db.commit()
    
    return {"message": "Team deleted successfully"}
