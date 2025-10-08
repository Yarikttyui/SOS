from app.core.database import sync_engine
from sqlalchemy import text

conn = sync_engine.connect()

# Получаем rescuer1
result = conn.execute(text("SELECT id, email, team_id FROM users WHERE email='rescuer1@test.ru'"))
row = result.fetchone()

print(f"\n=== RESCUER1 ===")
print(f"User ID: {row[0]}")
print(f"Email: {row[1]}")
print(f"Team ID: {row[2]}")

# Проверяем вызов, который мы создали
result = conn.execute(text("SELECT id, status, assigned_to, team_id, title FROM sos_alerts WHERE title='Нужна помощь!'"))
row = result.fetchone()

if row:
    print(f"\n=== ВЫЗОВ 'Нужна помощь!' ===")
    print(f"Alert ID: {row[0]}")
    print(f"Status: {row[1]}")
    print(f"Assigned to: {row[2]}")
    print(f"Team ID: {row[3]}")
    print(f"Title: {row[4]}")
else:
    print("\n❌ Вызов не найден")

conn.close()
