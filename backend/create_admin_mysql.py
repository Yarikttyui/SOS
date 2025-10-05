"""
Create admin user in MySQL database
"""
import mysql.connector
from passlib.context import CryptContext
import uuid

MYSQL_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '55646504',
    'database': 'rescue_db'
}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    """Create default admin user"""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        email = "admin@rescue.ru"
        password = "Admin123!"
        
        # Check if exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            print(f"✓ Admin user {email} already exists")
            return
        
        # Create admin
        user_id = str(uuid.uuid4())
        hashed_password = pwd_context.hash(password)
        
        cursor.execute("""
            INSERT INTO users 
            (id, email, hashed_password, role, full_name, is_active, is_verified) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            email,
            hashed_password,
            'admin',
            'System Administrator',
            True,
            True
        ))
        
        conn.commit()
        print(f"✅ Created admin user!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   ID: {user_id}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    create_admin()
