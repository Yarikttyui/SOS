"""Test team leader vs non-leader accepting alerts"""
import requests

print("=" * 70)
print("TEST 1: NON-LEADER (newuser@test.ru)")
print("=" * 70)

# Login as NON-LEADER
login = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'newuser@test.ru', 'password': 'Test1234'}
)

if login.status_code == 200:
    token = login.json()['access_token']
    me = requests.get(
        'http://localhost:8000/api/v1/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    ).json()
    
    print(f"✓ Logged in: {me['email']}")
    print(f"  Is team leader: {me.get('is_team_leader', False)}")
    print(f"  Team ID: {me.get('team_id', 'None')}")
    
    # Get alerts
    alerts_response = requests.get(
        'http://localhost:8000/api/v1/sos/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if alerts_response.status_code == 200:
        alerts = alerts_response.json()
        assigned_alert = next((a for a in alerts if a['status'] == 'assigned'), None)
        
        if assigned_alert:
            print(f"\n  Found ASSIGNED alert: {assigned_alert['id']}")
            
            # Try to accept
            update = requests.patch(
                f"http://localhost:8000/api/v1/sos/{assigned_alert['id']}",
                headers={'Authorization': f'Bearer {token}'},
                json={'status': 'in_progress'}
            )
            
            if update.status_code == 403:
                print(f"  ✓ CORRECTLY BLOCKED (403 Forbidden)")
                print(f"    Message: {update.json().get('detail', '')}")
            elif update.status_code == 200:
                print(f"  ✗ BUG: Non-leader was able to accept!")
            else:
                print(f"  ? Status: {update.status_code}")
        else:
            print(f"\n  No ASSIGNED alerts to test with")

print("\n" + "=" * 70)
print("TEST 2: TEAM LEADER (citizen@test.ru)")
print("=" * 70)

# Login as LEADER
login = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'citizen@test.ru', 'password': 'Test1234'}
)

if login.status_code == 200:
    token = login.json()['access_token']
    me = requests.get(
        'http://localhost:8000/api/v1/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    ).json()
    
    print(f"✓ Logged in: {me['email']}")
    print(f"  Is team leader: {me.get('is_team_leader', False)}")
    print(f"  Team ID: {me.get('team_id', 'None')}")
    
    # Get alerts
    alerts_response = requests.get(
        'http://localhost:8000/api/v1/sos/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if alerts_response.status_code == 200:
        alerts = alerts_response.json()
        assigned_alert = next((a for a in alerts if a['status'] == 'assigned'), None)
        
        if assigned_alert:
            print(f"\n  Found ASSIGNED alert: {assigned_alert['id']}")
            
            # Try to accept
            update = requests.patch(
                f"http://localhost:8000/api/v1/sos/{assigned_alert['id']}",
                headers={'Authorization': f'Bearer {token}'},
                json={'status': 'in_progress'}
            )
            
            if update.status_code == 200:
                print(f"  ✓ LEADER successfully accepted")
                result = update.json()
                print(f"    Status: {result['status']}")
                print(f"    Assigned to: {result.get('assigned_to_name', 'Unknown')}")
            else:
                print(f"  ✗ Failed: {update.status_code}")
                print(f"    {update.json()}")
        else:
            print(f"\n  No ASSIGNED alerts to test with")

print("\n" + "=" * 70)
