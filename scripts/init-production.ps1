# ==============================================================================
# UabIndia SaaS ERP - Windows / PowerShell Production First-Boot Script
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🚀 Initializing UabIndia SaaS ERP for Production..." -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Create .env if not present
if (-not (Test-Path ".env")) {
    Write-Host "📄 Generating production .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.production.example" ".env"

    # Generate random 64-char JWT key
    $bytes = New-Object byte[] 48
    (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    $randomJwt = [Convert]::ToBase64String($bytes) -replace '[^a-zA-Z0-9]', ''
    $randomJwt = $randomJwt.Substring(0, [Math]::Min(64, $randomJwt.Length))

    (Get-Content ".env") -replace "CHANGE_THIS_TO_YOUR_SECURE_256_BIT_RANDOM_JWT_SECRET_KEY_MIN_64_CHARS", $randomJwt | Set-Content ".env"
    Write-Host "✅ Cryptographically secure JWT Secret generated and saved." -ForegroundColor Green
}

# 2. Build and Launch Containers
Write-Host "🐳 Starting Docker containers (SQL Server, Redis, .NET API, Next.js, Nginx)..." -ForegroundColor Yellow
docker compose up -d --build

Write-Host "⏳ Waiting for Database & Backend API to become healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "======================================================================" -ForegroundColor Green
Write-Host "🎉 UabIndia ERP Production Stack is LIVE!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "🌐 Web Dashboard:       http://localhost (or your configured domain)"
Write-Host "🔌 REST API & Swagger:  http://localhost:5000/swagger"
Write-Host "🔑 Default SuperAdmin:  admin@uabindia.com / Admin@123456!"
Write-Host "💳 SaaS Plans Seeded:   Trial, Starter (₹2,499), Growth (₹6,999), Enterprise (₹19,999)"
Write-Host "📊 Database:            Microsoft SQL Server 2022 (Port 1433)"
Write-Host "⚡ Distributed Cache:   Redis 7 (Port 6379)"
Write-Host "======================================================================" -ForegroundColor Green
