"""
Migrate data from SQLite to MySQL
Run this to transfer existing data from rescue.db to MySQL
"""
import sqlite3
import mysql.connector
from mysql.connector import Error
import json

# SQLite database path
SQLITE_DB = '../rescue.db'

# MySQL connection settings
MYSQL_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '55646504',
    'database': 'rescue_db'
}


def migrate_users(sqlite_conn, mysql_conn):
    """Migrate users table"""
    try:
        sqlite_cursor = sqlite_conn.cursor()
        mysql_cursor = mysql_conn.cursor()
        
        # Get all users from SQLite
        sqlite_cursor.execute("SELECT * FROM users")
        users = sqlite_cursor.fetchall()
        
        # Get column names
        columns = [description[0] for description in sqlite_cursor.description]
        
        if not users:
            print("  No users to migrate")
            return 0
        
        # Insert into MySQL
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        insert_query = f"INSERT INTO users ({columns_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE email=email"
        
        count = 0
        for user in users:
            try:
                mysql_cursor.execute(insert_query, user)
                count += 1
            except Error as e:
                print(f"    ✗ Failed to insert user {user[1]}: {e}")
        
        mysql_conn.commit()
        print(f"  ✓ Migrated {count} users")
        return count
        
    except Exception as e:
        print(f"  ✗ Error migrating users: {e}")
        return 0


def migrate_sos_alerts(sqlite_conn, mysql_conn):
    """Migrate sos_alerts table"""
    try:
        sqlite_cursor = sqlite_conn.cursor()
        mysql_cursor = mysql_conn.cursor()
        
        # Get all alerts from SQLite
        sqlite_cursor.execute("SELECT * FROM sos_alerts")
        alerts = sqlite_cursor.fetchall()
        
        # Get column names
        columns = [description[0] for description in sqlite_cursor.description]
        
        if not alerts:
            print("  No alerts to migrate")
            return 0
        
        # Insert into MySQL
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        insert_query = f"INSERT INTO sos_alerts ({columns_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE id=id"
        
        count = 0
        for alert in alerts:
            try:
                # Convert JSON fields if needed
                alert_list = list(alert)
                mysql_cursor.execute(insert_query, alert_list)
                count += 1
            except Error as e:
                print(f"    ✗ Failed to insert alert {alert[0]}: {e}")
        
        mysql_conn.commit()
        print(f"  ✓ Migrated {count} SOS alerts")
        return count
        
    except Exception as e:
        print(f"  ✗ Error migrating alerts: {e}")
        return 0


def migrate_rescue_teams(sqlite_conn, mysql_conn):
    """Migrate rescue_teams table"""
    try:
        sqlite_cursor = sqlite_conn.cursor()
        mysql_cursor = mysql_conn.cursor()
        
        # Check if table exists in SQLite
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='rescue_teams'")
        if not sqlite_cursor.fetchone():
            print("  No rescue_teams table in SQLite")
            return 0
        
        # Get all teams from SQLite
        sqlite_cursor.execute("SELECT * FROM rescue_teams")
        teams = sqlite_cursor.fetchall()
        
        if not teams:
            print("  No teams to migrate")
            return 0
        
        # Get column names
        columns = [description[0] for description in sqlite_cursor.description]
        
        # Insert into MySQL
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        insert_query = f"INSERT INTO rescue_teams ({columns_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE id=id"
        
        count = 0
        for team in teams:
            try:
                mysql_cursor.execute(insert_query, team)
                count += 1
            except Error as e:
                print(f"    ✗ Failed to insert team {team[1]}: {e}")
        
        mysql_conn.commit()
        print(f"  ✓ Migrated {count} rescue teams")
        return count
        
    except Exception as e:
        print(f"  ✗ Error migrating teams: {e}")
        return 0


def migrate_notifications(sqlite_conn, mysql_conn):
    """Migrate notifications table"""
    try:
        sqlite_cursor = sqlite_conn.cursor()
        mysql_cursor = mysql_conn.cursor()
        
        # Check if table exists in SQLite
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
        if not sqlite_cursor.fetchone():
            print("  No notifications table in SQLite")
            return 0
        
        # Get all notifications from SQLite
        sqlite_cursor.execute("SELECT * FROM notifications")
        notifications = sqlite_cursor.fetchall()
        
        if not notifications:
            print("  No notifications to migrate")
            return 0
        
        # Get column names
        columns = [description[0] for description in sqlite_cursor.description]
        
        # Insert into MySQL
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        insert_query = f"INSERT INTO notifications ({columns_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE id=id"
        
        count = 0
        for notification in notifications:
            try:
                mysql_cursor.execute(insert_query, notification)
                count += 1
            except Error as e:
                print(f"    ✗ Failed to insert notification: {e}")
        
        mysql_conn.commit()
        print(f"  ✓ Migrated {count} notifications")
        return count
        
    except Exception as e:
        print(f"  ✗ Error migrating notifications: {e}")
        return 0


def main():
    """Main migration process"""
    print("="*70)
    print("SQLite to MySQL Migration")
    print("="*70)
    print(f"Source: {SQLITE_DB}")
    print(f"Target: {MYSQL_CONFIG['host']}/{MYSQL_CONFIG['database']}")
    print("="*70)
    print()
    
    # Connect to SQLite
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        print("✓ Connected to SQLite database")
    except Exception as e:
        print(f"✗ Failed to connect to SQLite: {e}")
        return
    
    # Connect to MySQL
    try:
        mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
        print("✓ Connected to MySQL database")
    except Error as e:
        print(f"✗ Failed to connect to MySQL: {e}")
        sqlite_conn.close()
        return
    
    print()
    print("Starting migration...")
    print()
    
    # Migrate tables
    total = 0
    
    print("1. Migrating users...")
    total += migrate_users(sqlite_conn, mysql_conn)
    
    print("2. Migrating SOS alerts...")
    total += migrate_sos_alerts(sqlite_conn, mysql_conn)
    
    print("3. Migrating rescue teams...")
    total += migrate_rescue_teams(sqlite_conn, mysql_conn)
    
    print("4. Migrating notifications...")
    total += migrate_notifications(sqlite_conn, mysql_conn)
    
    # Close connections
    sqlite_conn.close()
    mysql_conn.close()
    
    print()
    print("="*70)
    print(f"✅ Migration completed! Total records migrated: {total}")
    print("="*70)
    print()
    print("Next steps:")
    print("1. Verify data in MySQL: mysql -u root -p rescue_db")
    print("2. Restart your backend server")
    print("3. Test the application")
    print()


if __name__ == "__main__":
    main()
