"""
Test MySQL connection and basic operations
"""
import sys
sys.path.append('.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://root:55646504@127.0.0.1:3306/rescue_db"

print("="*70)
print("Testing MySQL Connection")
print("="*70)
print(f"Database URL: {DATABASE_URL}")
print()

try:
    # Create engine
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True
    )
    
    print("✓ Engine created")
    
    # Test connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT VERSION()"))
        version = result.fetchone()[0]
        print(f"✓ Connected to MySQL version: {version}")
        
        # Test database
        result = conn.execute(text("SELECT DATABASE()"))
        db = result.fetchone()[0]
        print(f"✓ Using database: {db}")
        
        # Count users
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        count = result.fetchone()[0]
        print(f"✓ Users table: {count} records")
        
        # Test query
        result = conn.execute(text("SELECT email, role FROM users LIMIT 3"))
        users = result.fetchall()
        print(f"\n📋 Sample users:")
        for email, role in users:
            print(f"  • {email:30} | {role}")
    
    print()
    print("="*70)
    print("✅ MySQL connection test PASSED!")
    print("="*70)
    print()
    print("Next step: Restart backend server")
    print("  Command: .\\start-backend.ps1")
    
except Exception as e:
    print()
    print("="*70)
    print("❌ MySQL connection test FAILED!")
    print("="*70)
    print(f"Error: {e}")
    print()
    print("Troubleshooting:")
    print("1. Check if MySQL server is running")
    print("2. Verify credentials in DATABASE_URL")
    print("3. Check if rescue_db database exists")
    print("4. Run: python create_mysql_database.py")
