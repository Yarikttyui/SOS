from app.core.database import sync_engine
from sqlalchemy import text
import uuid

conn = sync_engine.connect()

# Создаём вызов для команды rescuer1
alert_id = str(uuid.uuid4())
team_id_query = text("SELECT team_id FROM users WHERE email='rescuer1@test.ru'")
team_id = conn.execute(team_id_query).scalar()

user_id_query = text("SELECT id FROM users WHERE email='citizen@test.ru'")
user_id = conn.execute(user_id_query).scalar()

insert_query = text("""
    INSERT INTO sos_alerts (id, user_id, type, status, priority, latitude, longitude, title, description, team_id, created_at)
    VALUES (:alert_id, :user_id, 'general', 'assigned', 2, 55.7558, 37.6173, 'Нужна помощь!', 'Тестовый вызов для команды', :team_id, NOW())
""")

conn.execute(insert_query, {'alert_id': alert_id, 'user_id': user_id, 'team_id': team_id})
conn.commit()

print(f"✅ Создан тестовый вызов!")
print(f"   ID: {alert_id}")
print(f"   Команда: {team_id}")
print(f"   Статус: assigned")
print(f"   assigned_to: NULL (не назначен на конкретного спасателя)")
print(f"\n🔵 Теперь rescuer1@test.ru может принять этот вызов!")

conn.close()
