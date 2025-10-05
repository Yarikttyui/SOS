import requests
import json

# Логинимся как админ
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={
        'email': 'admin@test.ru',
        'password': 'Test1234'
    }
)

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f"✓ Logged in as admin")
    print(f"Token: {token[:20]}...")
    
    # Получаем информацию о себе
    me_response = requests.get(
        'http://localhost:8000/api/v1/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if me_response.status_code == 200:
        me = me_response.json()
        print(f"\n✓ Current user:")
        print(f"  Email: {me['email']}")
        print(f"  Role: {me['role']}")
        print(f"  Full name: {me.get('full_name', 'N/A')}")
    
    # Получаем всех пользователей
    users_response = requests.get(
        'http://localhost:8000/api/v1/users',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if users_response.status_code == 200:
        users = users_response.json()
        print(f"\n✓ Found {len(users)} users:")
        for user in users:
            print(f"  • {user['email']:25} | Role: {user['role']:12} | Name: {user.get('full_name', 'N/A')}")
    else:
        print(f"\n✗ Failed to get users: {users_response.status_code}")
        print(f"  {users_response.text}")
else:
    print(f"✗ Login failed: {login_response.status_code}")
    print(f"  {login_response.text}")
