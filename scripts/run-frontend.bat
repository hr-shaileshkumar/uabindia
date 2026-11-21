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
  "$pids = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; " ^
  "if ($pids) { " ^
  "  foreach ($pidVal in $pids) { " ^
  "    Write-Host 'Stopping existing process on port 3000 (PID '$pidVal')...' -ForegroundColor Yellow; " ^
  "    Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue; " ^
  "  } " ^
  "  Start-Sleep -Seconds 2; " ^
  "} else { " ^
  "  Write-Host 'No existing frontend process found on port 3000.'; " ^
  "}"

echo.
echo Entering frontend directory...
cd "%~dp0..\frontend"

if not exist node_modules (
    echo Installing dependencies...
    npm ci --legacy-peer-deps
)

if exist .next\BUILD_ID (
    echo.
    echo Detected production build cache in .next directory.
    echo Cleaning .next cache for development mode to ensure 100%% fresh CSS and chunk assets...
    powershell -NoProfile -Command "Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue"
)

echo.
echo Starting Next.js dev server...
echo Frontend will be available at:
echo   - http://localhost:3000
echo.

npm run dev
