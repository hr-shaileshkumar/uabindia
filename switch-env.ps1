<#
.SYNOPSIS
    Enterprise ERP Database & Environment Switcher for UabIndia ERP.
    Toggles between Development (UabIndia_ERP_Dev) and Production (UabIndia_ERP_Prod).

.EXAMPLE
    .\switch-env.ps1 -Status
    .\switch-env.ps1 -Environment dev
    .\switch-env.ps1 -Environment prod
#>

[CmdletBinding()]
param (
    [ValidateSet("dev", "prod", "Development", "Production")]
    [string]$Environment,

    [switch]$Status
)

$server = "localhost\SHAILESH"
$devDb = "UabIndia_ERP_Dev"
$prodDb = "UabIndia_ERP_Prod"

function Get-TableCount($dbName) {
    try {
        $srv = $script:server
        $connStr = "Server=$srv;Database=$dbName;Integrated Security=True;TrustServerCertificate=True;Connect Timeout=5;"
        $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';"
        $count = [int]$cmd.ExecuteScalar()
        $conn.Close()
        return $count
    } catch {
        return "Not Created / Offline"
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       UabIndia ERP: Database & Environment Switcher      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if ($Status -or ([string]::IsNullOrWhiteSpace($Environment))) {
    $currentEnv = [System.Environment]::GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "User")
    if ([string]::IsNullOrWhiteSpace($currentEnv)) {
        $currentEnv = [System.Environment]::GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Process")
    }
    if ([string]::IsNullOrWhiteSpace($currentEnv)) {
        $currentEnv = "Development (Default)"
    }

    Write-Host "`nCurrent Configuration:" -ForegroundColor Yellow
    Write-Host " - Active Environment Variable : $currentEnv" -ForegroundColor Green
    Write-Host " - SQL Server Instance         : $server" -ForegroundColor White

    Write-Host "`nDatabase Status:" -ForegroundColor Yellow
    $devTables = Get-TableCount $devDb
    $devColor = if ($devTables -is [int]) { "Green" } else { "Red" }
    Write-Host " - Development DB ($devDb) : $devTables Tables" -ForegroundColor $devColor

    $prodTables = Get-TableCount $prodDb
    $prodColor = if ($prodTables -is [int]) { "Green" } else { "Yellow" }
    Write-Host " - Production DB  ($prodDb) : $prodTables Tables" -ForegroundColor $prodColor

    Write-Host "`nUsage Instructions:" -ForegroundColor Cyan
    Write-Host "  Switch to Development: .\switch-env.ps1 -Environment dev" -ForegroundColor White
    Write-Host "  Switch to Production : .\switch-env.ps1 -Environment prod" -ForegroundColor White
    Write-Host "  View System Status   : .\switch-env.ps1 -Status" -ForegroundColor White
    exit 0
}

$targetEnv = if ($Environment -in "dev", "Development") { "Development" } else { "Production" }
$targetDb = if ($targetEnv -eq "Development") { $devDb } else { $prodDb }

Write-Host "`nSwitching environment to: $targetEnv..." -ForegroundColor Yellow

# Set for Process & User
[System.Environment]::SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", $targetEnv, "Process")
[System.Environment]::SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", $targetEnv, "User")

Write-Host "Environment set to [$targetEnv] successfully!" -ForegroundColor Green
Write-Host "Target Database: $targetDb" -ForegroundColor Cyan

$tbls = Get-TableCount $targetDb
Write-Host "Current table count in ${targetDb}: $tbls" -ForegroundColor White

Write-Host "`nTo start Backend in this environment:" -ForegroundColor Yellow
Write-Host "  dotnet run --project Backend/src/UabIndia.Api/UabIndia.Api.csproj" -ForegroundColor White
