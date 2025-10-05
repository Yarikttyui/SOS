"""Test all user passwords"""
import sys
sys.path.insert(0, 'c:\\Users\\.leo\\Desktop\\Svo\\backend')

from app.core.database import SessionLocal
from app.models import User
from app.core.security import verify_password

db = SessionLocal()
users = db.query(User).all()

print('=== TESTING ALL USER PASSWORDS ===\n')

test_password = 'Test1234'

for user in users:
    result = verify_password(test_password, user.hashed_password)
    status = '✅' if result else '❌'
    print(f'{status} {user.email:30} Password check: {result}')
    print(f'   Hash: {user.hashed_password[:50]}...')
    
print(f'\nTotal users: {len(users)}')
db.close()
