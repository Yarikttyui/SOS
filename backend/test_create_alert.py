"""Create test SOS alert"""
import requests
import json

# Login as citizen
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'citizen@test.ru', 'password': 'Test1234'}
)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f"Token: {token[:50]}...")
    
    # Create SOS alert
    alert_response = requests.post(
        'http://localhost:8000/api/v1/sos/',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'type': 'general',
            'latitude': 55.7558,
            'longitude': 37.6173,
            'title': 'Тестовый вызов',
            'description': 'Тестовое описание'
        }
    )
    
    print(f"\nAlert creation status: {alert_response.status_code}")
    if alert_response.status_code == 201:
        alert_data = alert_response.json()
        print(f"Alert ID: {alert_data['id']}")
        print(f"Status: {alert_data['status']}")
        print(f"Type: {alert_data['type']}")
        print("\n✅ Alert created successfully!")
    else:
        print(f"Error: {alert_response.text}")
else:
    print(f"Login failed: {login_response.text}")
