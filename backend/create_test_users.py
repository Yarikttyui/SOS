import requests
import json

# Backend URL
BASE_URL = "http://localhost:8000"

# Test user data
users = [
    {
        "email": "citizen@test.ru",
        "password": "Test1234",
        "full_name": "Test Citizen",
        "role": "citizen",
        "phone": "+79001111111"
    },
    {
        "email": "rescuer@test.ru",
        "password": "Test1234",
        "full_name": "Test Rescuer",
        "role": "rescuer",
        "phone": "+79002222222"
    },
    {
        "email": "operator@test.ru",
        "password": "Test1234",
        "full_name": "Test Operator",
        "role": "operator",
        "phone": "+79003333333"
    },
    {
        "email": "admin@test.ru",
        "password": "Test1234",
        "full_name": "Test Admin",
        "role": "admin",
        "phone": "+79004444444"
    }
]

print("=== CREATING TEST USERS ===\n")

for user in users:
    print(f"Creating {user['role']}: {user['email']}...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=user,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print(f"  ✓ SUCCESS! User ID: {response.json()['id']}")
        else:
            print(f"  ✗ ERROR: {response.status_code}")
            print(f"    {response.text}")
    except Exception as e:
        print(f"  ✗ EXCEPTION: {e}")
    
    print()

print("\n=== TESTING LOGIN ===\n")

# Test login with first user
test_user = users[0]
print(f"Logging in as {test_user['email']}...")

try:
    login_data = {
        "username": test_user['email'],
        "password": test_user['password']
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data=login_data,  # OAuth2 expects form data
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        tokens = response.json()
        print(f"  ✓ SUCCESS!")
        print(f"  Access Token: {tokens['access_token'][:50]}...")
        print(f"  Refresh Token: {tokens['refresh_token'][:50]}...")
    else:
        print(f"  ✗ ERROR: {response.status_code}")
        print(f"    {response.text}")
except Exception as e:
    print(f"  ✗ EXCEPTION: {e}")

print("\nDone!")
