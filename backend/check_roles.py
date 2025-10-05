"""
Check roles in database
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'rescue.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT DISTINCT role FROM users")
roles = cursor.fetchall()

print("Current roles in database:")
for role in roles:
    print(f"  - '{role[0]}'")

cursor.execute("SELECT email, role FROM users WHERE role LIKE '%coordinator%' OR role LIKE '%COORDINATOR%'")
coordinators = cursor.fetchall()

print(f"\nCoordinators found: {len(coordinators)}")
for email, role in coordinators:
    print(f"  - {email}: '{role}'")

conn.close()
