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

print("=== ТЕСТ УПРАВЛЕНИЯ ЧЛЕНАМИ КОМАНДЫ ===\n")

# 1. Получаем список команд
print("1. Получение списка команд:")
teams_response = requests.get(f"{BASE_URL}/api/v1/teams", headers=headers)
teams = teams_response.json()
print(f"   Найдено команд: {len(teams)}")
if teams:
    test_team = teams[0]
    print(f"   Тестируем команду: {test_team['name']} (ID: {test_team['id']})")
    print(f"   Текущих членов: {test_team.get('member_count', 0)}\n")

    # 2. Получаем список спасателей
    print("2. Получение списка спасателей:")
    rescuers_response = requests.get(f"{BASE_URL}/api/v1/users?role=rescuer", headers=headers)
    rescuers = rescuers_response.json()
    print(f"   Найдено спасателей: {len(rescuers)}")
    
    # Выбираем первых 3 спасателей
    selected_ids = [r['id'] for r in rescuers[:3]]
    print(f"   Выбраны ID: {selected_ids}\n")

    # 3. Обновляем членов команды
    print("3. Обновление членов команды:")
    update_response = requests.patch(
        f"{BASE_URL}/api/v1/teams/{test_team['id']}",
        headers=headers,
        json={"member_ids": selected_ids}
    )
    print(f"   Статус: {update_response.status_code}")
    
    if update_response.status_code == 200:
        print("   ✅ Члены команды успешно обновлены!")
        
        # 4. Проверяем результат
        print("\n4. Проверка обновленной команды:")
        team_response = requests.get(f"{BASE_URL}/api/v1/teams/{test_team['id']}", headers=headers)
        updated_team = team_response.json()
        print(f"   Команда: {updated_team['name']}")
        print(f"   Членов в команде: {updated_team.get('member_count', 0)}")
        
        if 'members' in updated_team and updated_team['members']:
            print("   Члены команды:")
            for member in updated_team['members']:
                if isinstance(member, dict):
                    print(f"     - {member.get('name', 'Unknown')}")
    else:
        print(f"   ❌ Ошибка: {update_response.text}")
else:
    print("   ⚠️ Команды не найдены")
