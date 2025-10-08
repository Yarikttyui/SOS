import requests
import json

BASE_URL = "http://localhost:8000"

# Логин координатора
login_response = requests.post(
    f"{BASE_URL}/api/v1/auth/login",
    json={"email": "coordinator@test.ru", "password": "Test1234"}
)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("=== ТЕСТ УПРАВЛЕНИЯ КОМАНДОЙ ===\n")

# Получаем команды
teams_response = requests.get(f"{BASE_URL}/api/v1/teams", headers=headers)
teams = teams_response.json()

test_team = None
for team in teams:
    if team.get('members') and len(team['members']) > 0:
        test_team = team
        break

if not test_team:
    print("❌ Нет команд с членами для тестирования")
    exit(1)

print(f"Тестируем команду: {test_team['name']}")
print(f"ID: {test_team['id']}")
print(f"Текущий руководитель: {test_team.get('leader_name', 'Нет')}")
print(f"Членов: {len(test_team.get('members', []))}\n")

# Получаем спасателей
rescuers_response = requests.get(f"{BASE_URL}/api/v1/users?role=rescuer", headers=headers)
rescuers = rescuers_response.json()

# 1. ТЕСТ: Удаление члена команды
if test_team.get('members') and len(test_team['members']) > 1:
    print("1. ТЕСТ: Удаление члена команды")
    
    member_to_remove = test_team['members'][0]
    member_name = member_to_remove.get('name', 'Unknown')
    member_id = member_to_remove.get('user_id')
    
    print(f"   Удаляем: {member_name} (ID: {member_id})")
    
    # Получаем список ID всех членов кроме удаляемого
    remaining_ids = [m.get('user_id') for m in test_team['members'] if m.get('user_id') != member_id]
    
    print(f"   Оставляем {len(remaining_ids)} членов")
    
    remove_response = requests.patch(
        f"{BASE_URL}/api/v1/teams/{test_team['id']}",
        headers=headers,
        json={"member_ids": remaining_ids}
    )
    
    if remove_response.status_code == 200:
        print("   ✅ Член успешно удален")
        updated_team = remove_response.json()
        print(f"   Членов осталось: {updated_team.get('member_count', 0)}\n")
    else:
        print(f"   ❌ Ошибка: {remove_response.status_code}")
        print(f"   {remove_response.text}\n")
else:
    print("1. ТЕСТ: Удаление члена - ПРОПУЩЕН (недостаточно членов)\n")

# 2. ТЕСТ: Изменение руководителя
print("2. ТЕСТ: Изменение руководителя")

# Находим спасателя, который не является текущим руководителем
new_leader = None
for rescuer in rescuers:
    if rescuer['id'] != test_team.get('leader_id') and rescuer.get('status') == 'available':
        new_leader = rescuer
        break

if new_leader:
    print(f"   Текущий руководитель: {test_team.get('leader_name', 'Нет')}")
    print(f"   Новый руководитель: {new_leader['full_name']} (ID: {new_leader['id']})")
    
    change_leader_response = requests.patch(
        f"{BASE_URL}/api/v1/teams/{test_team['id']}",
        headers=headers,
        json={"leader_id": new_leader['id']}
    )
    
    if change_leader_response.status_code == 200:
        print("   ✅ Руководитель успешно изменен")
        updated_team = change_leader_response.json()
        print(f"   Новый руководитель: {updated_team.get('leader_name', 'N/A')}\n")
    else:
        print(f"   ❌ Ошибка: {change_leader_response.status_code}")
        print(f"   {change_leader_response.text}\n")
else:
    print("   ⚠️ Не найдено доступных спасателей для смены руководителя\n")

# 3. ТЕСТ: Добавление члена команды
print("3. ТЕСТ: Добавление члена обратно")

# Получаем обновленную команду
team_detail_response = requests.get(f"{BASE_URL}/api/v1/teams/{test_team['id']}", headers=headers)
current_team = team_detail_response.json()

current_member_ids = [m.get('user_id') for m in current_team.get('members', [])]

# Находим спасателя, который не в команде
rescuer_to_add = None
for rescuer in rescuers:
    if rescuer['id'] not in current_member_ids:
        rescuer_to_add = rescuer
        break

if rescuer_to_add:
    print(f"   Добавляем: {rescuer_to_add['full_name']} (ID: {rescuer_to_add['id']})")
    
    new_member_ids = current_member_ids + [rescuer_to_add['id']]
    
    add_response = requests.patch(
        f"{BASE_URL}/api/v1/teams/{test_team['id']}",
        headers=headers,
        json={"member_ids": new_member_ids}
    )
    
    if add_response.status_code == 200:
        print("   ✅ Член успешно добавлен")
        updated_team = add_response.json()
        print(f"   Членов теперь: {updated_team.get('member_count', 0)}\n")
    else:
        print(f"   ❌ Ошибка: {add_response.status_code}")
        print(f"   {add_response.text}\n")
else:
    print("   ⚠️ Все спасатели уже в команде\n")

print("=== ТЕСТ ЗАВЕРШЕН ===")
