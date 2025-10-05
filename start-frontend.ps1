# Скрипт быстрого запуска Frontend
# Использование: .\start-frontend.ps1

Write-Host "🚀 Запуск Rescue System Frontend..." -ForegroundColor Green
Write-Host ""

# Проверка Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js не найден! Установите Node.js 18+" -ForegroundColor Red
    exit 1
}

# Переход в директорию frontend
Set-Location -Path "$PSScriptRoot\frontend"

# Проверка node_modules
if (!(Test-Path ".\node_modules")) {
    Write-Host "📦 Установка зависимостей..." -ForegroundColor Yellow
    npm install
}

# Проверка .env файла
if (!(Test-Path ".env.local")) {
    Write-Host "⚙️ Создание .env.local файла..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
}

# Запуск dev сервера
Write-Host ""
Write-Host "✅ Frontend запускается на http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Yellow
Write-Host ""

npm run dev
