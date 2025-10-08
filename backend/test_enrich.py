import sys
sys.path.insert(0, '.')

from app.core.database import get_db
from app.models.sos_alert import SOSAlert
from app.api.v1.sos import enrich_alert_with_names

print("Тестирование enrich_alert_with_names...")

db = next(get_db())

# Получаем первый алерт
alert = db.query(SOSAlert).first()

if not alert:
    print("❌ Нет вызовов в БД")
    exit(1)

print(f"✅ Найден вызов: {alert.id}")
print(f"   Статус: {alert.status}")
print(f"   Latitude type: {type(alert.latitude)}")
print(f"   Longitude type: {type(alert.longitude)}")

try:
    result = enrich_alert_with_names(alert, db)
    print("✅ enrich_alert_with_names работает!")
    print(f"   Результат: {result}")
except Exception as e:
    print(f"❌ Ошибка в enrich_alert_with_names: {e}")
    import traceback
    traceback.print_exc()
