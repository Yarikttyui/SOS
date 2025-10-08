"""Тест API принятия вызова"""
import sys
sys.path.insert(0, '.')

from app.core.database import sync_engine
from sqlalchemy import text

# Получим ID вызова со статусом 'assigned'
conn = sync_engine.connect()
result = conn.execute(text("SELECT id, status, assigned_to FROM sos_alerts WHERE status='assigned' LIMIT 1"))
alert = result.fetchone()

if not alert:
    print("❌ Нет вызовов со статусом 'assigned'")
    # Создадим тестовый
    conn.execute(text("""
        INSERT INTO sos_alerts (id, user_id, type, status, priority, latitude, longitude, title, description, created_at)
        VALUES (UUID(), (SELECT id FROM users WHERE email='citizen@test.ru'), 'general', 'assigned', 2, 55.7558, 37.6173, 'Тестовый вызов', 'Для теста API', NOW())
    """))
    conn.commit()
    result = conn.execute(text("SELECT id, status, assigned_to FROM sos_alerts WHERE status='assigned' LIMIT 1"))
    alert = result.fetchone()

alert_id, status, assigned_to = alert
print(f"\n📋 Вызов для теста: {alert_id}")
print(f"Текущий статус: {status}")
print(f"Назначен на: {assigned_to or 'Никому'}")

# Получим ID team leader'а
result = conn.execute(text("SELECT id, email, team_id FROM users WHERE role='rescuer' AND is_team_leader=1 LIMIT 1"))
leader = result.fetchone()
leader_id, leader_email, team_id = leader
print(f"\n👨‍🚒 Team Leader: {leader_email} (ID: {leader_id}, Team: {team_id})")

conn.close()

# Теперь сделаем API запрос
import requests

# Авторизация
login_resp = requests.post('http://localhost:8000/api/v1/auth/login', json={
    'email': leader_email,
    'password': 'Test1234'
})

if login_resp.status_code != 200:
    print(f"❌ Ошибка авторизации: {login_resp.text}")
    sys.exit(1)

token = login_resp.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

print(f"\n✅ Авторизация успешна")

# Принятие вызова
print(f"\n🔵 Принимаем вызов {alert_id}...")
accept_resp = requests.patch(f'http://localhost:8000/api/v1/sos/{alert_id}', json={}, headers=headers)

print(f"Статус ответа: {accept_resp.status_code}")
if accept_resp.status_code == 200:
    updated_alert = accept_resp.json()
    print(f"✅ Вызов принят!")
    print(f"   Новый статус: {updated_alert['status']}")
    print(f"   Назначен на: {updated_alert.get('assigned_to', 'НЕ УКАЗАНО!')}")
    print(f"   Команда: {updated_alert.get('team_id', 'НЕ УКАЗАНО!')}")
else:
    print(f"❌ Ошибка: {accept_resp.text}")

# Проверим в базе
conn = sync_engine.connect()
result = conn.execute(text(f"SELECT status, assigned_to, team_id FROM sos_alerts WHERE id='{alert_id}'"))
alert_after = result.fetchone()
status_after, assigned_after, team_after = alert_after

print(f"\n🔍 Проверка в БД:")
print(f"   Статус: {status_after}")
print(f"   Assigned to: {assigned_after or 'NULL ❌'}")
print(f"   Team: {team_after or 'NULL ❌'}")

if assigned_after == leader_id:
    print("\n✅ ВСЁ РАБОТАЕТ ПРАВИЛЬНО!")
else:
    print(f"\n❌ ПРОБЛЕМА: assigned_to должен быть {leader_id}, а это {assigned_after}")

conn.close()
