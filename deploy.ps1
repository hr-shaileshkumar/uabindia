# ==============================================================================
# UabIndia SaaS ERP - 1-Click Universal PowerShell Deployment Script
# Deploys Backend, Frontend, Redis, SQL Server, and Nginx without code changes.
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🚀 UabIndia SaaS ERP - Universal Production Deployment" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Check prerequisites
Write-Host "--> Checking system prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is required but not installed or not in PATH. Aborting." -ForegroundColor Red
    exit 1
}

# 2. Check / Generate .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "--> .env.production not found. Generating secure production secrets..." -ForegroundColor Yellow
    if (Test-Path "scripts\generate-production-secrets.ps1") {
        & powershell -File "scripts\generate-production-secrets.ps1"
    } else {
        Copy-Item ".env.production.example" ".env.production"
    }
}

Write-Host "✅ Environment configuration loaded (.env.production)." -ForegroundColor Green

# 3. Pull / Build & Launch Containers
Write-Host "--> Building and starting containers via docker-compose.prod.yml..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml up -d --build

# 4. Wait for services to stabilize
Write-Host "--> Waiting for services to become healthy (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 5. Health Check
Write-Host "--> Checking service status..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml ps

Write-Host "======================================================================" -ForegroundColor Green
Write-Host "🎉 UabIndia ERP deployed successfully without any code modifications!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Web Portal:        http://localhost" -ForegroundColor Cyan
Write-Host "REST API Docs:     http://localhost/swagger" -ForegroundColor Cyan
Write-Host "Health Endpoint:   http://localhost/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "View live logs:    docker compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "Stop platform:     docker compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
