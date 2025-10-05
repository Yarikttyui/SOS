"""Minimal test server"""
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import sys
sys.path.insert(0, 'c:\\Users\\.leo\\Desktop\\Svo\\backend')

from app.core.database import get_db
from app.models import User
from app.core.security import verify_password, create_access_token, create_refresh_token

app = FastAPI()

@app.post("/test-login")
async def test_login(db: Session = Depends(get_db)):
    email = "citizen@test.ru"
    password = "Test1234"
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"error": "User not found"}
    
    if not verify_password(password, user.hashed_password):
        return {"error": "Wrong password"}
    
    access_token = create_access_token(data={"sub": str(user.id), "role": str(user.role)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "success": True,
        "access_token": access_token[:50],
        "refresh_token": refresh_token[:50],
        "user": user.email
    }

@app.get("/")
async def root():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
