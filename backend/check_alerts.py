from app.core.database import sync_engine
from sqlalchemy import text

conn = sync_engine.connect()
result = conn.execute(text("SELECT id, status, assigned_to, team_id, title FROM sos_alerts ORDER BY created_at DESC LIMIT 10"))
rows = result.fetchall()

print("\n=== ПОСЛЕДНИЕ ВЫЗОВЫ ===")
for row in rows:
    alert_id, status, assigned_to, team_id, title = row
    assigned_status = f"Assigned to: {assigned_to}" if assigned_to else "Not assigned"
    team_status = f"Team: {team_id}" if team_id else "No team"
    print(f"{alert_id} | {status:15s} | {assigned_status[:36]:36s} | {team_status[:36]:36s} | {title}")

print(f"\nВсего вызовов: {len(rows)}")

# Проверим вызовы со статусом assigned
assigned_alerts = conn.execute(text("SELECT COUNT(*) FROM sos_alerts WHERE status='assigned'")).scalar()
print(f"Вызовов со статусом 'assigned': {assigned_alerts}")

conn.close()
