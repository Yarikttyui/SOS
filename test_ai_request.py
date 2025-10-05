import requests
import json

# Test AI analysis endpoint
url = "http://localhost:8000/api/v1/ai/analyze/text"

payload = {
    "text": "Пожар в жилом доме, есть пострадавшие, много дыма",
    "analysis_type": "classify"
}

print("📤 Отправка запроса к AI...")
print(f"Текст: {payload['text']}")
print()

try:
    response = requests.post(url, json=payload, timeout=30)
    
    print(f"📊 Статус: {response.status_code}")
    print()
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Успешный ответ:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("❌ Ошибка:")
        print(response.text)
        
except requests.exceptions.Timeout:
    print("⏱️ Таймаут - AI не ответил за 30 секунд")
except Exception as e:
    print(f"💥 Ошибка: {e}")
