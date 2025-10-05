import sqlite3

conn = sqlite3.connect('rescue.db')
cursor = conn.cursor()

cursor.execute("SELECT email, role, full_name, is_team_leader, team_id FROM users ORDER BY role, email")
users = cursor.fetchall()

print(f"\nTotal users: {len(users)}\n")
for email, role, name, is_leader, team_id in users:
    leader_mark = " [LEADER]" if is_leader else ""
    team_mark = f" (Team: {team_id})" if team_id else ""
    print(f"{email:30} | {role:12} | {name or 'N/A':20}{leader_mark}{team_mark}")

conn.close()
