<#
Script: configure_github_production_env.ps1
Purpose: Create a GitHub `production` environment for this repository and upload required environment secrets using the GitHub CLI (`gh`).

Usage (Windows PowerShell):
  1. Install and authenticate the GitHub CLI: `gh auth login`
  2. From the repository root run: `.\Backend\scripts\configure_github_production_env.ps1`

This script only creates the environment and sets secrets. Protecting the environment (required reviewers, wait timers)
is usually done via the GitHub UI under Settings → Environments → production (instructions printed at the end).
#>

param(
    [switch]$SetStagingSecrets
)

function ExitWithError($msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

if (-not (Get-Command gh -ErrorAction SilentlyContinue)){
    ExitWithError "GitHub CLI 'gh' not found. Install from https://cli.github.com/ and run 'gh auth login' before continuing."
}

# Determine repo slug (owner/repo)
$remote = (git config --get remote.origin.url) -as [string]
if (-not $remote){ ExitWithError "Cannot detect git remote origin. Run this from a cloned repository with an origin remote." }

if ($remote -match 'github.com[:/](.+?)/(.*?)(?:\.git)?$'){
    $owner = $matches[1]
    $repo = $matches[2]
    $slug = "$owner/$repo"
} else {
    ExitWithError "Unsupported remote URL format: $remote"
}

Write-Host "Repository detected: $slug"

# Create or ensure environment exists
Write-Host "Creating/ensuring environment 'production' exists..."
gh api -X PUT "/repos/$owner/$repo/environments/production" > $null
if ($LASTEXITCODE -ne 0){ ExitWithError "Failed to create environment via gh api. Ensure your token has repo permissions." }

Write-Host "Environment 'production' is ready.\n"

Write-Host "This helper will set these repository environment secrets for 'production':"
Write-Host " - PRODUCTION_DB_SERVER"
Write-Host " - PRODUCTION_DB_USER"
Write-Host " - PRODUCTION_DB_PASSWORD"

function ReadSecret($name){
    $val = Read-Host "Enter value for $name (or press Enter to skip)"
    return $val
}

# Optionally set staging secrets as well
if ($SetStagingSecrets){
    Write-Host "Also setting staging secrets (STAGING_DB_*) because --SetStagingSecrets was provided." -ForegroundColor Yellow
}

$p_db_server = ReadSecret 'PRODUCTION_DB_SERVER'
$p_db_user = ReadSecret 'PRODUCTION_DB_USER'
$p_db_password = ReadSecret 'PRODUCTION_DB_PASSWORD'

if ($p_db_server){ gh secret set PRODUCTION_DB_SERVER --repo $slug --env production --body $p_db_server }
if ($p_db_user){ gh secret set PRODUCTION_DB_USER --repo $slug --env production --body $p_db_user }
if ($p_db_password){ gh secret set PRODUCTION_DB_PASSWORD --repo $slug --env production --body $p_db_password }

if ($SetStagingSecrets){
    $s_db_server = ReadSecret 'STAGING_DB_SERVER'
    $s_db_user = ReadSecret 'STAGING_DB_USER'
    $s_db_password = ReadSecret 'STAGING_DB_PASSWORD'
    if ($s_db_server){ gh secret set STAGING_DB_SERVER --repo $slug --env staging --body $s_db_server }
    if ($s_db_user){ gh secret set STAGING_DB_USER --repo $slug --env staging --body $s_db_user }
    if ($s_db_password){ gh secret set STAGING_DB_PASSWORD --repo $slug --env staging --body $s_db_password }
}

Write-Host "Secrets uploaded (for values you entered).\n" -ForegroundColor Green

Write-Host "Manual next steps to configure environment protection and reviewers:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/$slug/settings/environments/production" -ForegroundColor Gray
Write-Host "2. Under 'Protection rules' add required reviewers (team or users) who must approve deployments." -ForegroundColor Gray
Write-Host "3. Optionally enable 'Wait timer' to enforce a delay before deployments." -ForegroundColor Gray
Write-Host "4. Optionally restrict which branches can deploy to production." -ForegroundColor Gray
Write-Host "5. Configure branch protection rules under Settings → Branches if needed." -ForegroundColor Gray

Write-Host "If you want, I can also provide gh api commands to add specific reviewers programmatically."

Write-Host "Done."
