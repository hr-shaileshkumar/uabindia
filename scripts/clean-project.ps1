<#
.SYNOPSIS
    Cleans generated build artifacts (node_modules, .next, bin, obj, dist, out)
    safely for .NET + Next.js / React project without freezing or recursion traps.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$SkipNodeModules,
    [switch]$DryRun
)

Write-Host "=== UabIndia Clean Build Artifacts ===" -ForegroundColor Cyan

# 1. Frontend target folders
$frontendTargets = @(
    "frontend\.next",
    "frontend\out",
    "frontend\dist"
)

if (-not $SkipNodeModules) {
    $frontendTargets += "frontend\node_modules"
    $frontendTargets += "node_modules"
}

# 2. Find Backend bin and obj folders safely
$backendProjects = Get-ChildItem -Path ".\Backend" -Directory -Recurse -Depth 3 | 
    Where-Object { $_.Name -in @('bin', 'obj') }

$allTargets = @()

foreach ($target in $frontendTargets) {
    if (Test-Path $target) {
        $allTargets += (Get-Item $target).FullName
    }
}

foreach ($item in $backendProjects) {
    $allTargets += $item.FullName
}

if ($allTargets.Count -eq 0) {
    Write-Host "[OK] Koi generated ya build folder nahi mila, repository already clean hai." -ForegroundColor Green
    exit 0
}

Write-Host "`nFound $($allTargets.Count) target folder(s) to clean:" -ForegroundColor Yellow
foreach ($target in $allTargets) {
    Write-Host " - $target" -ForegroundColor Gray
}

if ($DryRun) {
    Write-Host "`n[DryRun Mode] Koi folder delete nahi kiya gaya." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nCleaning folders..." -ForegroundColor Cyan

foreach ($target in $allTargets) {
    if (Test-Path $target) {
        try {
            Write-Host "Removing: $target ..." -NoNewline
            Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop
            Write-Host " [DONE]" -ForegroundColor Green
        } catch {
            Write-Host " [FAILED: $($_.Exception.Message)]" -ForegroundColor Red
        }
    }
}

Write-Host "`n[DONE] Sabhi generated folders clean ho chuke hain!" -ForegroundColor Green
Write-Host "`nDobara build/install karne ke liye:" -ForegroundColor Cyan
Write-Host " 1. Frontend: cd frontend ; npm install ; npm run dev" -ForegroundColor White
Write-Host " 2. Backend : dotnet restore ; dotnet build" -ForegroundColor White
