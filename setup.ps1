# PowerShell Build and Setup Script for ERP System
# This script fixes all configuration issues for both Backend and Frontend

param(
    [ValidateSet('backend', 'frontend', 'both')]
    [string]$Component = 'both',
    
    [switch]$Clean,
    [switch]$Build,
    [switch]$Run
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ERP System - Build & Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================== BACKEND SETUP ====================
if ($Component -eq 'both' -or $Component -eq 'backend') {
    Write-Host "🔧 BACKEND SETUP" -ForegroundColor Yellow
    Write-Host "==================" -ForegroundColor Yellow
    
    # Check .NET Installation
    try {
        $dotnetVersion = dotnet --version
        Write-Host "✅ .NET SDK found: $dotnetVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ .NET SDK not found. Please install .NET 8.0 SDK" -ForegroundColor Red
        Write-Host "   Download from: https://dotnet.microsoft.com/download" -ForegroundColor Red
        exit 1
    }
    
    # Clean if requested
    if ($Clean) {
        Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Cyan
        dotnet clean UabIndia.sln
        Remove-Item -Path "Backend/src/*/bin" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "Backend/src/*/obj" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Clean completed" -ForegroundColor Green
    }
    
    # Restore dependencies
    Write-Host ""
    Write-Host "📦 Restoring dependencies..." -ForegroundColor Cyan
    dotnet restore UabIndia.sln
    Write-Host "✅ Dependencies restored" -ForegroundColor Green
    
    # Build
    if ($Build -or $Run) {
        Write-Host ""
        Write-Host "🔨 Building Backend..." -ForegroundColor Cyan
        dotnet build UabIndia.sln -c Debug
        Write-Host "✅ Build completed" -ForegroundColor Green
    }
    
    # Run
    if ($Run) {
        Write-Host ""
        Write-Host "🚀 Starting Backend API..." -ForegroundColor Cyan
        Write-Host "   API URLs:" -ForegroundColor Gray
        Write-Host "   - http://localhost:5000" -ForegroundColor Gray
        Write-Host "   - https://localhost:5001" -ForegroundColor Gray
        Write-Host ""
        Push-Location "Backend/src/UabIndia.Api"
        dotnet run --no-build
        Pop-Location
    }
    
    Write-Host ""
}

# ==================== FRONTEND SETUP ====================
if ($Component -eq 'both' -or $Component -eq 'frontend') {
    Write-Host "🎨 FRONTEND SETUP" -ForegroundColor Yellow
    Write-Host "==================" -ForegroundColor Yellow
    
    # Check Node.js Installation
    try {
        $nodeVersion = node --version
        $npmVersion = npm --version
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
        Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js or npm not found" -ForegroundColor Red
        Write-Host "   Download from: https://nodejs.org" -ForegroundColor Red
        exit 1
    }
    
    # Verify Next.js
    Push-Location frontend
    
    Write-Host ""
    Write-Host "🔍 Verifying Next.js installation..." -ForegroundColor Cyan
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.dependencies.next -or $packageJson.devDependencies.next) {
            Write-Host "✅ Next.js is in package.json" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Next.js not found in package.json" -ForegroundColor Yellow
            Write-Host "   Installing Next.js 16.1.6..." -ForegroundColor Cyan
            npm install next@16.1.6 --save
        }
    }
    
    # Clean if requested
    if ($Clean) {
        Write-Host ""
        Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Cyan
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Clean completed" -ForegroundColor Green
    }
    
    # Install dependencies
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm ci --legacy-peer-deps
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    
    # Build
    if ($Build -or $Run) {
        Write-Host ""
        Write-Host "🔨 Building Frontend..." -ForegroundColor Cyan
        npm run build
        Write-Host "✅ Build completed" -ForegroundColor Green
    }
    
    # Run
    if ($Run) {
        Write-Host ""
        Write-Host "🚀 Starting Frontend Dev Server..." -ForegroundColor Cyan
        Write-Host "   Frontend URLs:" -ForegroundColor Gray
        Write-Host "   - http://localhost:3000" -ForegroundColor Gray
        Write-Host ""
        npm run dev
    }
    
    Pop-Location
}

Write-Host ""
Write-Host "✅ Setup completed!" -ForegroundColor Green
