# Enterprise Modular Platform Quick Start Script
# Launches ASP.NET Core API (Port 5000) and Next.js Enterprise ERP Portal (Port 3000)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching Enterprise Modular Platform (UabIndia)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend API
Write-Host "--> Starting ASP.NET Core API Backend (http://localhost:5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Backend\src\UabIndia.Api'; dotnet run"

# 2. Start Frontend Next.js App (All ERP & HRMS Modules)
Write-Host "--> Starting Next.js ERP Suite (http://localhost:3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; cmd /c npm run dev"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "✅ Platform Services Launching in Background Terminals:" -ForegroundColor Green
Write-Host "   - Backend API & Swagger: http://localhost:5000/swagger" -ForegroundColor Green
Write-Host "   - Full ERP & HRMS Suite: http://localhost:3000" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

