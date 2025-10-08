import requests
import json

# Логин оператора
login_data = {"email": "operator@test.ru", "password": "Test1234"}
resp = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Получение вызовов
alerts_resp = requests.get("http://localhost:8000/api/v1/sos/", headers=headers)
print(f"Статус ответа: {alerts_resp.status_code}")
print(f"Ответ: {alerts_resp.text}")

if alerts_resp.status_code != 200:
    print(f"\n❌ ОШИБКА {alerts_resp.status_code}")
    exit(1)

alerts = alerts_resp.json()

print("=== ВЫЗОВЫ ДЛЯ ОПЕРАТОРА ===")
print(f"Статус ответа: {alerts_resp.status_code}")
print(f"Всего вызовов: {len(alerts)}")

if len(alerts) == 0:
    print("\n❌ Вызовы не возвращаются!")
    print("Проверим напрямую в БД...")
else:
    print("\nПервые 3 вызова:")
    for alert in alerts[:3]:
        print(f"  - {alert['id']}: {alert['status']} | {alert.get('title', 'No title')}")

# Теперь спасатель
print("\n" + "="*50)
login_data = {"email": "rescuer1@test.ru", "password": "Test1234"}
resp = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

alerts_resp = requests.get("http://localhost:8000/api/v1/sos/", headers=headers)
alerts = alerts_resp.json()

print("=== ВЫЗОВЫ ДЛЯ СПАСАТЕЛЯ ===")
print(f"Статус ответа: {alerts_resp.status_code}")
print(f"Всего вызовов: {len(alerts)}")

if len(alerts) == 0:
    print("\n❌ Вызовы не возвращаются!")
else:
    print("\nПервые 3 вызова:")
    for alert in alerts[:3]:
        print(f"  - {alert['id']}: {alert['status']} | {alert.get('title', 'No title')}")
