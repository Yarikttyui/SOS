import requests
import json

BASE_URL = "http://localhost:8000"

# Логин координатора
login_response = requests.post(
    f"{BASE_URL}/api/v1/auth/login",
    json={"email": "coordinator@test.ru", "password": "Test1234"}
)

if login_response.status_code != 200:
    print(f"Ошибка входа: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("=== ПРОВЕРКА СТРУКТУРЫ ДАННЫХ КОМАНД ===\n")

# Получаем список команд
teams_response = requests.get(f"{BASE_URL}/api/v1/teams", headers=headers)
teams = teams_response.json()

print(f"Всего команд: {len(teams)}\n")

for i, team in enumerate(teams, 1):
    print(f"{i}. Команда: {team.get('name', 'БЕЗ НАЗВАНИЯ')}")
    print(f"   ID: {team.get('id', 'N/A')}")
    print(f"   Тип: {team.get('type', 'N/A')}")
    print(f"   Статус: {team.get('status', 'N/A')}")
    print(f"   Руководитель ID: {team.get('leader_id', 'Нет')}")
    print(f"   Имя руководителя: {team.get('leader_name', 'Нет')}")
    
    members = team.get('members', [])
    print(f"   Членов: {len(members) if members else 0}")
    
    if members:
        print(f"   Типы членов: {type(members)}")
        if len(members) > 0:
            print(f"   Первый член (тип): {type(members[0])}")
            print(f"   Первый член (данные): {members[0]}")
    
    equipment = team.get('equipment', [])
    if equipment:
        print(f"   Оборудование (тип): {type(equipment)}")
        if len(equipment) > 0:
            print(f"   Первое оборудование (тип): {type(equipment[0])}")
    
    print(f"   Создана: {team.get('created_at', 'Неизвестно')}")
    print()

# Проверяем детали одной команды
if teams:
    test_team_id = teams[0]['id']
    print(f"\n=== ДЕТАЛИ КОМАНДЫ {teams[0]['name']} ===\n")
    
    team_detail_response = requests.get(f"{BASE_URL}/api/v1/teams/{test_team_id}", headers=headers)
    team_detail = team_detail_response.json()
    
    print(json.dumps(team_detail, indent=2, ensure_ascii=False))
