# Полный запуск системы SOS Rescue
# Использование: .\start-all.ps1

Write-Host "🚀 Запуск SOS Rescue System..." -ForegroundColor Green
Write-Host ""

# Запуск Backend в новом окне
Write-Host "📡 Запуск Backend..." -ForegroundColor Yellow
$backendScript = Join-Path $PSScriptRoot "start-backend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", $backendScript

Start-Sleep -Seconds 5

# Запуск Frontend в новом окне
Write-Host "🌐 Запуск Frontend..." -ForegroundColor Yellow
$frontendScript = Join-Path $PSScriptRoot "start-frontend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", $frontendScript

Write-Host ""
Write-Host "✅ Система запускается!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Ссылки:" -ForegroundColor Cyan
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend:     http://localhost:3001" -ForegroundColor White
Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "ℹ️  Для остановки закройте окна PowerShell" -ForegroundColor Yellow
Write-Host ""
