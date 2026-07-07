@echo off
REM ERP Backend Dev Run Script
REM Uses dotnet watch so local startup stays incremental.

echo.
echo ========================================
echo ERP Backend - Dev Run
echo ========================================
echo.

where dotnet >nul 2>nul
if errorlevel 1 (
    echo ERROR: dotnet CLI is not installed or not in PATH
    echo Please install .NET 8.0 SDK from https://dotnet.microsoft.com/download
    exit /b 1
)

echo Checking .NET version...
dotnet --version

echo.
echo Checking for an existing backend process...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Get-Process UabIndia.Api -ErrorAction SilentlyContinue; " ^
  "if ($p) { " ^
  "  Write-Host 'Stopping existing UabIndia.Api process...' -ForegroundColor Yellow; " ^
  "  $p | Stop-Process -Force; " ^
  "  Start-Sleep -Seconds 2; " ^
  "} else { " ^
  "  Write-Host 'No existing backend process found.'; " ^
  "}"

echo.
echo Starting backend API in watch mode...
echo API will be available at:
echo   - http://localhost:5000
echo   - https://localhost:5001
echo.

dotnet watch run --project Backend\src\UabIndia.Api\UabIndia.Api.csproj
