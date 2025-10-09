"""
Authentication endpoints
"""
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, UserRole
from app.models.team import RescueTeam
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_user_with_team(user: User, db: Session) -> dict:
    """Get user dict with team name"""
    team_name = None
    if user.team_id:
        team = db.query(RescueTeam).filter(RescueTeam.id == user.team_id).first()
        if team:
            team_name = team.name
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "specialization": user.specialization,
        "team_id": user.team_id,
        "team_name": team_name,
        "is_team_leader": user.is_team_leader,
        "is_shared_account": user.is_shared_account,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


def _normalize_email(value: str) -> str:
    """Normalize email for consistent comparisons."""
    return value.strip().lower()


def _normalize_phone(value: Optional[str]) -> Optional[str]:
    """Normalize phone by removing spaces and separator characters."""
    if not value:
        return None
    cleaned = re.sub(r"[\s()\-]", "", value).strip()
    return cleaned or None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register new user (always as CITIZEN)
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters
    
    Note: All new users are registered as citizens. 
    Admins can later change roles through user management.
    """
    normalized_email = _normalize_email(user_data.email)
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    normalized_phone = _normalize_phone(user_data.phone)

    if normalized_phone:
        phone_exists = db.query(User).filter(User.phone == normalized_phone).first()
        if phone_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=normalized_email,
        hashed_password=hashed_password,
        phone=normalized_phone,
        full_name=user_data.full_name.strip() if user_data.full_name else None,
        role=UserRole.CITIZEN  # Always CITIZEN for registration
    )
    
    db.add(new_user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "users.phone" in str(exc.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            ) from exc
        if "users.email" in str(exc.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid registration data"
        ) from exc

    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login user with JSON
    
    Returns access and refresh tokens
    """
    normalized_email = _normalize_email(login_data.email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": get_user_with_team(user, db)
    }


@router.post("/login/form", response_model=Token)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login user with form data (OAuth2 compatible)
    
    Returns access and refresh tokens
    """
    normalized_email = _normalize_email(form_data.username)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": get_user_with_team(user, db)
    }


@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(request: dict, db: Session = Depends(get_db)):
    """
    Refresh access token
    
    - **refresh_token**: Valid refresh token (in request body)
    """
    refresh_token = request.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="refresh_token is required"
        )
    
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    new_access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    return get_user_with_team(current_user, db)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user
    
    In a production app, you would invalidate the token here
    """
    return {"message": "Successfully logged out"}
