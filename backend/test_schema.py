import sys
sys.path.insert(0, '.')

from app.schemas.sos import SOSAlertResponse
from datetime import datetime

test_dict = {
    'id': '00401830-c1eb-48ee-acb0-62fd2e3b1292',
    'user_id': 'c0c2dc95-cfb8-42af-9bc3-bc71e2ad9e8b',
    'type': 'water_rescue',
    'status': 'in_progress',
    'priority': 2,
    'latitude': 55.74,
    'longitude': 37.63,
    'address': 'Парк Сокольники',
    'title': 'Утопающий',
    'description': 'Человек в воде',
    'media_urls': [],
    'ai_analysis': None,
    'assigned_to': None,
    'team_id': None,
    'created_at': datetime(2025, 10, 8, 4, 33),
    'updated_at': datetime(2025, 10, 8, 6, 3, 49),
    'assigned_at': datetime(2025, 10, 8, 6, 3, 49),
    'completed_at': None,
    'assigned_to_name': None,
    'team_name': None
}

print("Тестирование SOSAlertResponse...")

try:
    alert = SOSAlertResponse(**test_dict)
    print("✅ SOSAlertResponse валидация успешна!")
    print(f"   Type: {alert.type}")
    print(f"   Status: {alert.status}")
except Exception as e:
    print(f"❌ Ошибка валидации: {e}")
    import traceback
    traceback.print_exc()
