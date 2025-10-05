# Запуск Backend сервера
# Использование: .\start-backend.ps1

Write-Host "🚀 Запуск Backend..." -ForegroundColor Green
Write-Host ""

# Переход в директорию backend
Set-Location -Path "$PSScriptRoot\backend"

# Проверка виртуального окружения
if (!(Test-Path ".\venv")) {
    Write-Host "❌ Виртуальное окружение не найдено!" -ForegroundColor Red
    Write-Host "   Создайте его: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Активация виртуального окружения
Write-Host "🔧 Активация виртуального окружения..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Запуск сервера
Write-Host ""
Write-Host "✅ Backend запущен:" -ForegroundColor Green
Write-Host "   API:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
