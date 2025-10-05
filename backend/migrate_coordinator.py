"""
Migration script: Add coordinator role and rescuer specialization fields
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'rescue.db')

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting migration...")
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN specialization VARCHAR(50)")
            print("✓ Added specialization column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- specialization column already exists")
            else:
                raise
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN team_id VARCHAR(36)")
            print("✓ Added team_id column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- team_id column already exists")
            else:
                raise
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_team_leader BOOLEAN DEFAULT 0")
            print("✓ Added is_team_leader column")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- is_team_leader column already exists")
            else:
                raise
        
        try:
            cursor.execute("ALTER TABLE rescue_teams ADD COLUMN leader_id VARCHAR(36)")
            print("✓ Added leader_id column to rescue_teams")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- leader_id column already exists")
            else:
                raise
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
