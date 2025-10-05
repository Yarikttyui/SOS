"""
Set user as coordinator
"""
import sqlite3
import os

# Path to database
db_path = os.path.join(os.path.dirname(__file__), '..', 'rescue.db')

def set_coordinator(email: str):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Find user by email
        cursor.execute("SELECT id, email, role FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ User with email '{email}' not found")
            return
        
        user_id, user_email, current_role = user
        print(f"Found user: {user_email} (current role: {current_role})")
        
        # Update role to coordinator
        cursor.execute("UPDATE users SET role = 'coordinator' WHERE id = ?", (user_id,))
        conn.commit()
        
        print(f"✅ User '{user_email}' is now a coordinator!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python set_coordinator.py <email>")
        print("Example: python set_coordinator.py 123123@gmail.com")
    else:
        set_coordinator(sys.argv[1])
