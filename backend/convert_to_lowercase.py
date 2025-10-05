import sqlite3

conn = sqlite3.connect('rescue.db')
cursor = conn.cursor()

print("Converting all roles to lowercase...")

try:
    cursor.execute("BEGIN TRANSACTION")
    
    conversions = [
        ('CITIZEN', 'citizen'),
        ('RESCUER', 'rescuer'),
        ('OPERATOR', 'operator'),
        ('COORDINATOR', 'coordinator'),
        ('ADMIN', 'admin')
    ]
    
    for uppercase, lowercase in conversions:
        cursor.execute(f"UPDATE users SET role = ? WHERE role = ?", (lowercase, uppercase))
        rows_updated = cursor.rowcount
        if rows_updated > 0:
            print(f"  ✓ Converted {rows_updated} {uppercase} → {lowercase}")
    
    print("\nRecreating table with lowercase constraint...")
    
    cursor.execute("DROP TABLE IF EXISTS users_new")
    print("  ✓ Dropped users_new table if existed")
    
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
    print("  ✓ Created new users table with lowercase constraint")
    
    cursor.execute("""
        INSERT INTO users_new 
        SELECT * FROM users
    """)
    print("  ✓ Copied data to new table")
    
    cursor.execute("DROP TABLE users")
    print("  ✓ Dropped old table")
    
    cursor.execute("ALTER TABLE users_new RENAME TO users")
    print("  ✓ Renamed new table to users")
    
    cursor.execute("CREATE UNIQUE INDEX idx_users_email ON users(email)")
    cursor.execute("CREATE INDEX idx_users_phone ON users(phone)")
    print("  ✓ Recreated indexes")
    
    conn.commit()
    print("\n✅ Migration completed successfully!")
    
    cursor.execute("SELECT DISTINCT role FROM users ORDER BY role")
    roles = [row[0] for row in cursor.fetchall()]
    print(f"\nCurrent roles: {', '.join(repr(r) for r in roles)}")
    
except Exception as e:
    conn.rollback()
    print(f"\n❌ Migration failed: {e}")
    
finally:
    conn.close()
