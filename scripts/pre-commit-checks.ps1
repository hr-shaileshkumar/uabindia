param()

Write-Host "Running pre-commit checks..."

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

# 1) Prevent committing .env or keystore files
$forbidden = @('*.env','*.jks','*.keystore','*.pfx','*.pem')
$staged = git diff --cached --name-only
foreach ($pattern in $forbidden) {
    foreach ($file in $staged) {
        if ($file -like $pattern) {
            Write-Error "Blocked commit: $file matches forbidden pattern $pattern. Remove or move it before committing."
            exit 1
        }
    }
}

# 2) Prevent large files (>50MB)
$maxBytes = 50MB
foreach ($file in $staged) {
    if (Test-Path $file) {
        $size = (Get-Item $file).length
        if ($size -gt $maxBytes) {
            Write-Error "Blocked commit: $file is larger than 50MB ($([math]::Round($size/1MB,2)) MB). Use LFS or remove it."
            exit 1
        }
    }
}

# 3) Run dotnet format verify if dotnet-format is installed
if (Get-Command dotnet-format -ErrorAction SilentlyContinue) {
    Write-Host "Running 'dotnet format --verify-no-changes'..."
    dotnet format --verify-no-changes
    if ($LASTEXITCODE -ne 0) {
        Write-Error "dotnet format found issues. Run 'dotnet format' to fix formatting."
        exit 1
    }
} else {
    Write-Host "dotnet-format not installed; skipping format check. (Install dotnet tool: 'dotnet tool install -g dotnet-format')"
}

# 4) Run frontend lint if configured
$frontendPkg = Join-Path $repoRoot 'frontend/package.json'
if (Test-Path $frontendPkg) {
    $pkg = Get-Content $frontendPkg -Raw | ConvertFrom-Json
    if ($pkg.scripts -and $pkg.scripts.lint) {
        Write-Host "Running frontend lint: npm --prefix frontend run lint"
        npm --prefix frontend run lint
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Frontend lint failed. Fix lint errors before committing."
            exit 1
        }
    }
}

Write-Host "Pre-commit checks passed."
exit 0
