# ERP Login Diagnostic Script
# Run this script to diagnose login issues on localhost

Write-Host "=== ERP Login Diagnostic Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "[1] Checking Backend Status..." -ForegroundColor Yellow
$backendProcess = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*UabIndia.Api*" }
if ($backendProcess) {
    Write-Host "  ✓ Backend is running (PID: $($backendProcess.Id))" -ForegroundColor Green
    Write-Host "  Path: $($backendProcess.Path)" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Backend is NOT running" -ForegroundColor Red
    Write-Host "  Start with: cd Backend\src\UabIndia.Api; dotnet run" -ForegroundColor Yellow
}

# Check if frontend is running
Write-Host ""
Write-Host "[2] Checking Frontend Status..." -ForegroundColor Yellow
$frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*frontend*" -or $_.ProcessName -eq "node" }
if ($frontendProcess) {
    Write-Host "  ✓ Frontend is running (PID: $($frontendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "  ✗ Frontend is NOT running" -ForegroundColor Red
    Write-Host "  Start with: cd frontend; npm run dev" -ForegroundColor Yellow
}

# Check port 5000 (backend)
Write-Host ""
Write-Host "[3] Checking Backend Port (5000)..." -ForegroundColor Yellow
$backendPort = netstat -ano | Select-String ":5000" | Select-Object -First 1
if ($backendPort) {
    Write-Host "  ✓ Port 5000 is in use" -ForegroundColor Green
    Write-Host "  $backendPort" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Port 5000 is NOT listening" -ForegroundColor Red
}

# Check port 3000/3001 (frontend)
Write-Host ""
Write-Host "[4] Checking Frontend Port (3000/3001)..." -ForegroundColor Yellow
$frontendPort = netstat -ano | Select-String ":300[01]" | Select-Object -First 1
if ($frontendPort) {
    Write-Host "  ✓ Frontend port is in use" -ForegroundColor Green
    Write-Host "  $frontendPort" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Frontend port is NOT listening" -ForegroundColor Red
}

# Check database connection
Write-Host ""
Write-Host "[5] Checking Database Connection..." -ForegroundColor Yellow
try {
    $connectionString = "Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;TrustServerCertificate=True;"
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    Write-Host "  ✓ Database connection successful" -ForegroundColor Green
    Write-Host "  Database: UabIndia_HRMS" -ForegroundColor Gray
    
    # Check if admin user exists
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT COUNT(*) FROM Users WHERE Email = 'admin@uabindia.in' AND IsSystemAdmin = 1 AND IsDeleted = 0"
    $count = $command.ExecuteScalar()
    
    if ($count -gt 0) {
        Write-Host "  ✓ Admin user exists in database" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Admin user NOT found in database" -ForegroundColor Red
        Write-Host "  The database should auto-create admin on startup" -ForegroundColor Yellow
    }
    
    $connection.Close()
} catch {
    Write-Host "  ✗ Database connection failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host "  Make sure SQL Server is running" -ForegroundColor Yellow
}

# Check JWT configuration consistency
Write-Host ""
Write-Host "[6] Checking JWT Configuration..." -ForegroundColor Yellow
$envJwt = if (Test-Path ".env") { Get-Content ".env" | Select-String "Jwt__Key" | Select-Object -First 1 }
$appJwt = if (Test-Path "Backend\src\UabIndia.Api\appsettings.Development.json") { Get-Content "Backend\src\UabIndia.Api\appsettings.Development.json" | Select-String '"Key"' | Select-Object -First 1 }

if ($envJwt -and $appJwt) {
    if ($envJwt -match $appJwt) {
        Write-Host "  ✓ JWT keys are consistent" -ForegroundColor Green
    } else {
        Write-Host "  ✗ JWT keys do NOT match" -ForegroundColor Red
        Write-Host "  .env: $envJwt" -ForegroundColor Yellow
        Write-Host "  appsettings: $appJwt" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Could not verify JWT configuration" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login URL: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Email: admin@uabindia.in" -ForegroundColor Gray
Write-Host "  Password: Admin@123" -ForegroundColor Gray
Write-Host ""
