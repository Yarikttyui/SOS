# Скрипт быстрого запуска Backend
# Использование: .\start-backend.ps1

Write-Host "🚀 Запуск Rescue System Backend..." -ForegroundColor Green
Write-Host ""

# Проверка Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python не найден! Установите Python 3.11+" -ForegroundColor Red
    exit 1
}

# Переход в директорию backend
Set-Location -Path "$PSScriptRoot\backend"

# Проверка виртуального окружения
if (!(Test-Path ".\venv")) {
    Write-Host "📦 Создание виртуального окружения..." -ForegroundColor Yellow
    python -m venv venv
}

# Активация виртуального окружения
Write-Host "🔧 Активация виртуального окружения..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Установка зависимостей
Write-Host "📦 Установка зависимостей..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Проверка .env файла
if (!(Test-Path ".env")) {
    Write-Host "⚙️ Создание .env файла..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️ Отредактируйте файл .env перед продолжением!" -ForegroundColor Yellow
    code .env
    Read-Host "Нажмите Enter после редактирования .env"
}

# Запуск сервера
Write-Host ""
Write-Host "✅ Backend запускается на http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
