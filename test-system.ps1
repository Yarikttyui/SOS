# Test Script - Check system health
# Usage: .\test-system.ps1

Write-Host "=== Rescue System Health Check ===" -ForegroundColor Green
Write-Host ""

# Check Backend
Write-Host "1. Checking Backend API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   OK - Backend running (http://localhost:8000)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR - Backend not accessible" -ForegroundColor Red
}

# Check Frontend  
Write-Host ""
Write-Host "2. Checking Frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   OK - Frontend running (http://localhost:3001)" -ForegroundColor Green
} catch {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   OK - Frontend running (http://localhost:5173)" -ForegroundColor Green
    } catch {
        Write-Host "   ERROR - Frontend not accessible" -ForegroundColor Red
    }
}

# Check database
Write-Host ""
Write-Host "3. Checking database..." -ForegroundColor Cyan
if (Test-Path "c:\Users\.leo\Desktop\Svo\backend\rescue.db") {
    Write-Host "   OK - SQLite database exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR - Database not found" -ForegroundColor Red
}

# Check Swagger
Write-Host ""
Write-Host "4. Checking Swagger docs..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   OK - Swagger available (http://localhost:8000/docs)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR - Swagger not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:3001" -ForegroundColor White
Write-Host ""
