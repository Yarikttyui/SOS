# Запуск Frontend сервера
# Использование: .\start-frontend.ps1

Write-Host "🚀 Запуск Frontend..." -ForegroundColor Green
Write-Host ""

# Переход в директорию frontend
Set-Location -Path "$PSScriptRoot\frontend"

# Проверка node_modules
if (!(Test-Path ".\node_modules")) {
    Write-Host "❌ Зависимости не установлены!" -ForegroundColor Red
    Write-Host "   Установите их: npm install" -ForegroundColor Yellow
    exit 1
}

# Запуск dev сервера
Write-Host ""
Write-Host "✅ Frontend запущен: http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

npm run dev
