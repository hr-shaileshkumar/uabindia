@echo off
REM ERP Backend Build and Run Script

echo.
echo ========================================
echo ERP Backend - Build and Run
echo ========================================
echo.

REM Check if dotnet is installed
where dotnet >nul 2>nul
if errorlevel 1 (
    echo ERROR: dotnet CLI is not installed or not in PATH
    echo Please install .NET 8.0 SDK from https://dotnet.microsoft.com/download
    exit /b 1
)

echo Checking .NET version...
dotnet --version

echo.
echo Step 1: Restoring dependencies...
dotnet restore

echo.
echo Step 2: Building solution...
dotnet build UabIndia.sln -c Debug

echo.
echo Step 3: Starting Backend API...
echo.
echo API will be available at:
echo   - http://localhost:5000
echo   - https://localhost:5001
echo.

cd Backend\src\UabIndia.Api
dotnet run --no-build
