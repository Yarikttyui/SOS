from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Database connection
DATABASE_URL = "mysql+pymysql://root:55646504@127.0.0.1:3306/rescue_db"
engine = create_engine(DATABASE_URL)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_coordinator_password():
    email = "123123@gmail.com"
    new_password = "Test1234"
    
    # Hash the password
    hashed_password = pwd_context.hash(new_password)
    
    # Update the password
    with engine.connect() as conn:
        result = conn.execute(
            text("UPDATE users SET hashed_password = :password WHERE email = :email"),
            {"password": hashed_password, "email": email}
        )
        conn.commit()
        
        print(f"✅ Password reset for {email}")
        print(f"New password: {new_password}")
        print(f"Rows updated: {result.rowcount}")
        
        # Verify the user
        user = conn.execute(
            text("SELECT email, role, full_name FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()
        
        if user:
            print(f"\n👤 User details:")
            print(f"Email: {user[0]}")
            print(f"Role: {user[1]}")
            print(f"Name: {user[2]}")
        else:
            print(f"❌ User not found after update!")

if __name__ == "__main__":
    reset_coordinator_password()
