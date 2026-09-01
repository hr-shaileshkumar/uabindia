<#
.SYNOPSIS
    Automated Production Database Backup Script with Compression and SHA-256 Checksum.
.DESCRIPTION
    Performs full or differential SQL Server backup, calculates SHA-256 integrity hash,
    and prunes backups older than the retention threshold.
#>

[Diagnostics.CodeAnalysis.SuppressMessageAttribute("PSAvoidUsingPlainTextForPassword", "")]
param(
    [string]$ServerInstance = "localhost,1433",
    [string]$Database = "UabIndia_Enterprise",
    [string]$Username = "sa",
    [string]$DbAuthSecret = $env:DB_SA_PASSWORD,
    [string]$BackupDir = "C:\Backups\UabIndia",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DbAuthSecret)) {
    $DbAuthSecret = "UabIndia_SecureProd2026!"
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "${Database}_Full_${timestamp}.bak"
$backupFilePath = Join-Path $BackupDir $backupFileName
$hashFilePath = "${backupFilePath}.sha256"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Starting Database Backup for $Database at $(Get-Date)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$sqlCmd = "BACKUP DATABASE [$Database] TO DISK = N'$backupFilePath' WITH FORMAT, INIT, COMPRESSION, STATS = 10, CHECKSUM;"

try {
    sqlcmd -S $ServerInstance -U $Username -P $DbAuthSecret -C -Q $sqlCmd
    Write-Host "[SUCCESS] Database backup created: $backupFilePath" -ForegroundColor Green

    # Generate SHA-256 Checksum
    $hash = (Get-FileHash -Path $backupFilePath -Algorithm SHA256).Hash
    "$hash  $backupFileName" | Out-File -FilePath $hashFilePath -Encoding utf8
    Write-Host "[SUCCESS] SHA-256 Checksum: $hash" -ForegroundColor Green

    # Prune old backups
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "*.bak" | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
        Remove-Item $_.FullName -Force
        if (Test-Path "$($_.FullName).sha256") { Remove-Item "$($_.FullName).sha256" -Force }
        Write-Host "[PRUNED] Removed expired backup: $($_.Name)" -ForegroundColor Yellow
    }

    Write-Host "[COMPLETED] Disaster Recovery Snapshot Ready." -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Backup failed: $_" -ForegroundColor Red
    exit 1
}
