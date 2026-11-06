@echo off
REM UabIndia.Api Local Dev Runner
REM Automatically stops any locked/hanging UabIndia.Api process before launching dotnet run
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-Process UabIndia.Api -ErrorAction SilentlyContinue; if ($p) { Write-Host 'Stopping existing UabIndia.Api process...' -ForegroundColor Yellow; $p | Stop-Process -Force; Start-Sleep -Milliseconds 800 }"
dotnet run
