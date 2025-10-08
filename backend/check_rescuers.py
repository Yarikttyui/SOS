from app.core.database import sync_engine
from sqlalchemy import text

conn = sync_engine.connect()
result = conn.execute(text("SELECT email, role, is_team_leader, team_id FROM users WHERE role='rescuer'"))
rows = result.fetchall()

print("\n=== СПАСАТЕЛИ ===")
for row in rows:
    email, role, is_leader, team_id = row
    leader_status = "✅ Team Leader" if is_leader else "❌ Not leader"
    team_status = f"Team: {team_id}" if team_id else "No team"
    print(f"{email:30s} {leader_status:20s} {team_status}")

print(f"\nВсего спасателей: {len(rows)}")
print(f"Лидеров команд: {sum(1 for r in rows if r[2])}")

conn.close()
