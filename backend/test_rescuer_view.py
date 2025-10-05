"""Test rescuer seeing ASSIGNED alerts"""
import requests
import json

# Login as rescuer
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'rescuer@test.ru', 'password': 'Test1234'}
)

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f"✅ Rescuer logged in")
    
    # Get user info
    me_response = requests.get(
        'http://localhost:8000/api/v1/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    user_id = me_response.json()['id']
    print(f"   Rescuer ID: {user_id}")
    
    # Get all alerts
    alerts_response = requests.get(
        'http://localhost:8000/api/v1/sos/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    alerts = alerts_response.json()
    print(f"\n📋 Total alerts visible: {len(alerts)}")
    
    for alert in alerts:
        print(f"\nAlert ID: {alert['id'][:8]}...")
        print(f"  Status: {alert['status']}")
        print(f"  Assigned to: {alert.get('assigned_to', 'NULL')}")
        print(f"  Type: {alert['type']}")
    
    # Filter ASSIGNED without rescuer
    available = [a for a in alerts if a['status'] == 'assigned' and not a.get('assigned_to')]
    print(f"\n🆓 Available ASSIGNED alerts (not assigned to anyone): {len(available)}")
    
    # Filter MY alerts
    my_alerts = [a for a in alerts if a.get('assigned_to') == user_id]
    print(f"👤 My alerts (assigned to me): {len(my_alerts)}")
else:
    print(f"Login failed: {login_response.text}")
