"""
Check MySQL database contents
"""
import mysql.connector
from mysql.connector import Error

MYSQL_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '55646504',
    'database': 'rescue_db'
}

try:
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor()
    
    print("="*70)
    print("MySQL Database Contents")
    print("="*70)
    
    # Check users
    cursor.execute("SELECT email, role, full_name, is_team_leader, team_id FROM users ORDER BY role, email")
    users = cursor.fetchall()
    
    print(f"\n📊 USERS ({len(users)} total):")
    print("-"*70)
    for email, role, name, is_leader, team_id in users:
        leader_mark = " [LEADER]" if is_leader else ""
        team_mark = f" (Team: {team_id})" if team_id else ""
        print(f"{email:30} | {role:12} | {name or 'N/A':20}{leader_mark}{team_mark}")
    
    # Check alerts
    cursor.execute("SELECT COUNT(*) FROM sos_alerts")
    alert_count = cursor.fetchone()[0]
    print(f"\n📊 SOS ALERTS: {alert_count} total")
    
    # Check teams
    cursor.execute("SELECT COUNT(*) FROM rescue_teams")
    team_count = cursor.fetchone()[0]
    print(f"\n📊 RESCUE TEAMS: {team_count} total")
    
    # Check notifications
    cursor.execute("SELECT COUNT(*) FROM notifications")
    notif_count = cursor.fetchone()[0]
    print(f"\n📊 NOTIFICATIONS: {notif_count} total")
    
    print("\n" + "="*70)
    print("✅ MySQL database is ready!")
    print("="*70)
    
    cursor.close()
    conn.close()
    
except Error as e:
    print(f"✗ Error: {e}")
