"""
Geolocation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.team import RescueTeam

router = APIRouter()


@router.get("/nearest-teams")
async def get_nearest_teams(
    latitude: float,
    longitude: float,
    radius_km: float = 50.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find nearest rescue teams
    
    - **latitude**: Location latitude
    - **longitude**: Location longitude
    - **radius_km**: Search radius in kilometers
    """
    # Simple distance calculation (for MVP, use proper PostGIS in production)
    teams = db.query(RescueTeam).filter(
        RescueTeam.status == "available"
    ).all()
    
    # TODO: Implement proper distance calculation
    nearby_teams = []
    for team in teams:
        if team.current_latitude and team.current_longitude:
            # Simplified distance check
            nearby_teams.append({
                "id": str(team.id),
                "name": team.name,
                "type": team.type,
                "latitude": float(team.current_latitude),
                "longitude": float(team.current_longitude),
                "distance_km": 0  # TODO: Calculate actual distance
            })
    
    return nearby_teams


@router.get("/hydrants")
async def get_nearby_hydrants(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get nearby fire hydrants (mock data for MVP)
    
    In production, integrate with city infrastructure database
    """
    # Mock hydrants data for Tver
    mock_hydrants = [
        {
            "id": "h1",
            "latitude": 56.8587,
            "longitude": 35.9176,
            "type": "underground",
            "status": "operational"
        },
        {
            "id": "h2",
            "latitude": 56.8597,
            "longitude": 35.9186,
            "type": "surface",
            "status": "operational"
        }
    ]
    
    return mock_hydrants


@router.post("/geocode")
async def geocode_address(
    address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Convert address to coordinates
    
    - **address**: Address string
    """
    # TODO: Integrate with geocoding service (Yandex Maps, Google Maps, etc.)
    return {
        "address": address,
        "latitude": 56.8587,
        "longitude": 35.9176,
        "provider": "mock"
    }


@router.post("/reverse-geocode")
async def reverse_geocode(
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Convert coordinates to address
    
    - **latitude**: Location latitude
    - **longitude**: Location longitude
    """
    # TODO: Integrate with geocoding service
    return {
        "latitude": latitude,
        "longitude": longitude,
        "address": "Тверь, Россия",
        "provider": "mock"
    }
