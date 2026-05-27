@echo off
REM UabIndia ERP Backend Deployment Script for Windows
REM Run this on your server at 152.59.146.98

echo 🚀 Starting UabIndia ERP Backend Deployment...

REM Check if .NET is installed
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ .NET is not installed. Please install .NET 8 runtime first.
    pause
    exit /b 1
)

echo ✅ .NET found: 
dotnet --version

REM Set environment variables (update these with your actual values)
set ASPNETCORE_ENVIRONMENT=Production
set ConnectionStrings__DefaultConnection=Server=your_sql_server;Database=UabIndia_HRMS;User Id=your_username;Password=your_password;TrustServerCertificate=True;Encrypt=True;MultipleActiveResultSets=true
set Jwt__Key=your-secure-jwt-key-minimum-64-characters-long-here
set Jwt__Issuer=https://api.uabindia.in
set Jwt__Audience=uabindia_clients
set Encryption__Key=your-encryption-key-32-characters-here

echo 🔧 Environment variables set

REM Navigate to the API directory
cd Backend\src\UabIndia.Api
if %errorlevel% neq 0 (
    echo ❌ Cannot find Backend\src\UabIndia.Api directory
    pause
    exit /b 1
)

echo 📁 In directory: %cd%

REM Build the application
echo 🔨 Building application...
dotnet build --configuration Release
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build successful

REM Run the application
echo 🚀 Starting application on port 80...
start /B dotnet run --configuration Release --urls "http://0.0.0.0:80"

REM Wait a moment
timeout /t 5 /nobreak >nul

REM Check if it's running
tasklist /FI "IMAGENAME eq dotnet.exe" /NH | findstr /C:"dotnet.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ Application started successfully!
    echo 🌐 Should be accessible at: https://api.uabindia.in
    echo 🔍 Check health: https://api.uabindia.in/health/live
) else (
    echo ❌ Application failed to start
    pause
    exit /b 1
)

echo 📋 Check Task Manager for dotnet.exe process
echo 💡 To stop: End task in Task Manager
echo 💡 To restart: Run this script again
pause