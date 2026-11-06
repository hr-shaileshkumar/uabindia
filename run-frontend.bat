@echo off
REM ERP Frontend Dev Run Script
REM Starts Next.js directly in dev mode so local startup stays fast.

echo.
echo ========================================
echo ERP Frontend - Dev Run
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version

echo.
echo Checking for an existing frontend process on port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$pidOn3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1; " ^
  "if ($pidOn3000) { " ^
  "  Write-Host 'Stopping existing process on port 3000 (PID '$pidOn3000')...' -ForegroundColor Yellow; " ^
  "  Stop-Process -Id $pidOn3000 -Force; " ^
  "  Start-Sleep -Seconds 2; " ^
  "} else { " ^
  "  Write-Host 'No existing frontend process found on port 3000.'; " ^
  "}"

echo.
echo Entering frontend directory...
cd frontend

if not exist node_modules (
    echo Installing dependencies...
    npm ci --legacy-peer-deps
)

echo.
echo Starting Next.js dev server...
echo Frontend will be available at:
echo   - http://localhost:3000
echo.

npm run dev
