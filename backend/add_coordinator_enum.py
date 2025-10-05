"""
Add COORDINATOR to UserRole enum in database
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'rescue.db')

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting migration to add COORDINATOR role...")
        
        cursor.execute("DROP TABLE IF EXISTS users_new")
        print("✓ Dropped users_new table if existed")
        
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        print(f"Found {len(columns)} columns in users table")
        
        cursor.execute("""
            CREATE TABLE users_new (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) UNIQUE,
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK(role IN ('CITIZEN', 'RESCUER', 'OPERATOR', 'COORDINATOR', 'ADMIN')),
                full_name VARCHAR(255),
                specialization VARCHAR(50),
                team_id VARCHAR(36),
                is_team_leader BOOLEAN DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                is_verified BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created new users table")
        
        cursor.execute("""
            INSERT INTO users_new (id, email, phone, hashed_password, role, full_name, 
                                  specialization, team_id, is_team_leader, is_active, 
                                  is_verified, created_at, updated_at)
            SELECT id, email, phone, hashed_password, 
                   CASE 
                       WHEN role = 'coordinator' THEN 'COORDINATOR'
                       ELSE role
                   END as role,
                   full_name,
                   specialization, team_id, is_team_leader, is_active,
                   is_verified, created_at, updated_at
            FROM users
        """)
        print("✓ Copied data to new table")
        
        cursor.execute("DROP TABLE users")
        print("✓ Dropped old table")
        
        cursor.execute("ALTER TABLE users_new RENAME TO users")
        print("✓ Renamed new table to users")
        
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)")
        print("✓ Recreated indexes")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print("COORDINATOR role is now available in the database")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
