<#
Install git hooks by setting core.hooksPath to .githooks
Run from repository root:
  .\scripts\install-git-hooks.ps1
#>
param()

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git not found. Install git before running this script."; exit 1
}

$root = Get-Location
Write-Host "Setting repository git hooks path to '.githooks'..."
git config core.hooksPath .githooks
if ($LASTEXITCODE -eq 0) { Write-Host "core.hooksPath set. Ensure .githooks/pre-commit is executable on non-Windows systems." }
else { Write-Error "Failed to set core.hooksPath."; exit 1 }

Write-Host "Done. To enable checks for all devs, ask them to run this script locally or include it in onboarding docs."
