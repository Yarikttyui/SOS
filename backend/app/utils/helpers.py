"""
Helper utilities
"""
import hashlib
import secrets
from datetime import datetime
from typing import Any, Optional


def generate_random_string(length: int = 32) -> str:
    """Generate random string"""
    return secrets.token_urlsafe(length)


def hash_file(file_data: bytes) -> str:
    """Generate hash of file"""
    return hashlib.sha256(file_data).hexdigest()


def format_datetime(dt: datetime) -> str:
    """Format datetime to string"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates in kilometers
    Using Haversine formula
    """
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def sanitize_filename(filename: str) -> str:
    """Sanitize filename"""
    import re
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    return filename


def is_valid_coordinates(latitude: float, longitude: float) -> bool:
    """Check if coordinates are valid"""
    return -90 <= latitude <= 90 and -180 <= longitude <= 180
