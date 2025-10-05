"""Simple login test without requests library"""
import sys
sys.path.insert(0, 'c:\\Users\\.leo\\Desktop\\Svo\\backend')

from app.core.database import SessionLocal
from app.models.user import User  
from app.core.security import verify_password

# Test database connection
print("Testing database...")
db = SessionLocal()
user = db.query(User).filter(User.email == 'citizen@test.ru').first()

if user:
    print(f"✅ User found: {user.email}")
    print(f"   Role: {user.role}")
    print(f"   Active: {user.is_active}")
    print(f"   Hash: {user.hashed_password[:50]}...")
    
    # Test password
    pwd = 'Test1234'
    result = verify_password(pwd, user.hashed_password)
    print(f"✅ Password verification: {result}")
else:
    print("❌ User not found")

db.close()
