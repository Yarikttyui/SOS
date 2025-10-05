# Скрипт для запуска backend с доступом из локальной сети
Write-Host "Запуск Rescue System Backend..."
Write-Host "Backend будет доступен по адресу: http://192.168.1.113:8000"
Write-Host ""

cd backend
& venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
