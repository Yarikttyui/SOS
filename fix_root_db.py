import sqlite3
import sys

db_path = 'c:/Users/.leo/Desktop/Svo/rescue.db'

print(f"Migrating database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("BEGIN TRANSACTION")
    
    cursor.execute("DROP TABLE IF EXISTS users_new")
    print("  ✓ Dropped users_new if existed")
    
    cursor.execute("""
        CREATE TABLE users_new (
            id VARCHAR(36) PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(20) UNIQUE,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK(role IN ('citizen', 'rescuer', 'operator', 'coordinator', 'admin')),
            full_name VARCHAR(255),
            specialization VARCHAR(50),
            team_id VARCHAR(36),
            is_team_leader BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            is_verified BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✓ Created users_new with lowercase constraint")
    
    cursor.execute("""
        INSERT INTO users_new 
        SELECT 
            id, email, phone, hashed_password,
            CASE 
                WHEN role = 'CITIZEN' THEN 'citizen'
                WHEN role = 'RESCUER' THEN 'rescuer'
                WHEN role = 'OPERATOR' THEN 'operator'
                WHEN role = 'COORDINATOR' THEN 'coordinator'
                WHEN role = 'ADMIN' THEN 'admin'
                ELSE LOWER(role)
            END as role,
            full_name, specialization, team_id, is_team_leader,
            is_active, is_verified, created_at, updated_at
        FROM users
    """)
    print("  ✓ Copied data with lowercase roles")
    
    cursor.execute("DROP TABLE users")
    print("  ✓ Dropped old users table")
    
    cursor.execute("ALTER TABLE users_new RENAME TO users")
    print("  ✓ Renamed users_new to users")
    
    cursor.execute("CREATE UNIQUE INDEX idx_users_email ON users(email)")
    cursor.execute("CREATE INDEX idx_users_phone ON users(phone)")
    print("  ✓ Recreated indexes")
    
    conn.commit()
    print("\n✅ Migration completed!")
    
    cursor.execute("SELECT email, role FROM users ORDER BY email")
    print("\nUsers after migration:")
    for email, role in cursor.fetchall():
        print(f"  • {email:30} | {role}")
    
except Exception as e:
    conn.rollback()
    print(f"\n❌ Migration failed: {e}")
    sys.exit(1)
finally:
    conn.close()
