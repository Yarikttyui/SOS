import requests

# Логин координатора
login_data = {"email": "coordinator@test.ru", "password": "Test1234"}
resp = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
print(f"Login status: {resp.status_code}")

if resp.status_code != 200:
    print(f"❌ Ошибка авторизации: {resp.text}")
    exit(1)

token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n=== ТЕСТ API ДЛЯ КООРДИНАТОРА ===\n")

# Проверяем получение спасателей
print("1. Получение спасателей (role=rescuer):")
try:
    resp = requests.get("http://localhost:8000/api/v1/users?role=rescuer", headers=headers)
    print(f"   Статус: {resp.status_code}")
    if resp.status_code == 200:
        rescuers = resp.json()
        print(f"   ✅ Получено спасателей: {len(rescuers)}")
        if len(rescuers) > 0:
            print(f"   Первый: {rescuers[0]['email']}")
    else:
        print(f"   ❌ Ошибка: {resp.text}")
except Exception as e:
    print(f"   ❌ Exception: {e}")

# Проверяем получение команд
print("\n2. Получение команд:")
try:
    resp = requests.get("http://localhost:8000/api/v1/teams", headers=headers)
    print(f"   Статус: {resp.status_code}")
    if resp.status_code == 200:
        teams = resp.json()
        print(f"   ✅ Получено команд: {len(teams)}")
        if len(teams) > 0:
            print(f"   Первая: {teams[0]['name']}")
    else:
        print(f"   ❌ Ошибка: {resp.text}")
except Exception as e:
    print(f"   ❌ Exception: {e}")

# Проверяем создание команды
print("\n3. Создание команды:")
try:
    team_data = {
        "name": "Тестовая бригада",
        "type": "general",
        "contact_phone": "+7 (999) 123-45-67",
        "contact_email": "test@team.ru"
    }
    resp = requests.post("http://localhost:8000/api/v1/teams", json=team_data, headers=headers)
    print(f"   Статус: {resp.status_code}")
    if resp.status_code == 201:
        team = resp.json()
        print(f"   ✅ Команда создана: {team['name']}")
    else:
        print(f"   ❌ Ошибка: {resp.text}")
except Exception as e:
    print(f"   ❌ Exception: {e}")
