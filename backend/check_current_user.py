from app.core.database import sync_engine
from sqlalchemy import text

conn = sync_engine.connect()

# Проверяем спасателя по ID из логов
user_id = '89f6d0f5-8803-414b-96a0-bbd918c67467'
team_id = '45e61304-c663-4c7c-a9fc-09a2fdaff600'

result = conn.execute(text(f"SELECT email, role, is_team_leader, team_id FROM users WHERE id='{user_id}'"))
row = result.fetchone()

if row:
    print(f"\n=== СПАСАТЕЛЬ ИЗ БРАУЗЕРА ===")
    print(f"Email: {row[0]}")
    print(f"Role: {row[1]}")
    print(f"Is Team Leader: {row[2]}")
    print(f"Team ID: {row[3]}")
else:
    print(f"❌ Пользователь {user_id} не найден")

# Проверяем команду
result = conn.execute(text(f"SELECT id, name FROM rescue_teams WHERE id='{team_id}'"))
row = result.fetchone()

if row:
    print(f"\n=== КОМАНДА ===")
    print(f"Team ID: {row[0]}")
    print(f"Name: {row[1]}")
else:
    print(f"❌ Команда {team_id} не найдена")

# Проверяем вызовы для этой команды
result = conn.execute(text(f"SELECT id, title, status, assigned_to, team_id FROM sos_alerts WHERE team_id='{team_id}'"))
rows = result.fetchall()

print(f"\n=== ВЫЗОВЫ ДЛЯ КОМАНДЫ {team_id} ===")
if rows:
    for row in rows:
        print(f"  - {row[1]}: {row[2]} (assigned_to: {row[3]})")
else:
    print("  Нет вызовов для этой команды")

conn.close()
