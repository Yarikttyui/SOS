# Full System Startup Script
# Usage: .\start-all.ps1

Write-Host "Starting Rescue System..." -ForegroundColor Green
Write-Host ""

# Start Docker services (PostgreSQL, Redis)
Write-Host "Starting Docker services..." -ForegroundColor Cyan
docker-compose up -d postgres redis

Start-Sleep -Seconds 5

# Start Backend in new window
Write-Host "Starting Backend..." -ForegroundColor Yellow
$backendScript = Join-Path $PSScriptRoot "start-backend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", $backendScript

Start-Sleep -Seconds 3

# Start Frontend in new window
Write-Host "Starting Frontend..." -ForegroundColor Yellow
$frontendScript = Join-Path $PSScriptRoot "start-frontend.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-File", $frontendScript

Write-Host ""
Write-Host "System is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop: close all PowerShell windows" -ForegroundColor Yellow
