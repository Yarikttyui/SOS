# Simple System Startup (without Docker)
# Usage: .\start-simple.ps1

Write-Host "Starting Rescue System (Simple Mode)..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python is not installed! Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Found: Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Backend Setup
Write-Host "Setting up Backend..." -ForegroundColor Yellow
cd backend

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Create .env file with SQLite
Write-Host "Creating .env file..." -ForegroundColor Cyan
$envContent = @"
APP_NAME="Rescue System"
APP_VERSION="1.0.0"
DEBUG=True
ENVIRONMENT=development

HOST=0.0.0.0
PORT=8000

DATABASE_URL=sqlite:///./rescue.db
REDIS_URL=redis://localhost:6379/0

SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=http://localhost:3000,http://localhost:5173

OPENAI_API_KEY=47d22a91-9b0f-412b-a3ed-b93f522f6b6b

MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

DEFAULT_LOCATION_LAT=56.8587
DEFAULT_LOCATION_LON=35.9176
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "Starting Backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

cd ..

Start-Sleep -Seconds 5

# Frontend Setup
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
cd frontend

# Install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node dependencies..." -ForegroundColor Cyan
    npm install
}

# Create .env file
Write-Host "Creating .env file..." -ForegroundColor Cyan
$frontendEnv = @"
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
"@

$frontendEnv | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "Starting Frontend dev server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

cd ..

Write-Host ""
Write-Host "System is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: Using SQLite database (no Docker required)" -ForegroundColor Yellow
Write-Host "NOTE: Redis features disabled without Docker" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop: close all PowerShell windows" -ForegroundColor Yellow
