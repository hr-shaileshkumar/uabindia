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

Write-Host "This helper will configure repository environment secrets for 'production':"
Write-Host " [Database Secrets]"
Write-Host "  - PRODUCTION_DB_SERVER"
Write-Host "  - PRODUCTION_DB_USER"
Write-Host "  - PRODUCTION_DB_PASSWORD"
Write-Host " [SSH Deployment Secrets (production-deploy.yml)]"
Write-Host "  - PROD_SERVER_HOST"
Write-Host "  - PROD_SERVER_USER"
Write-Host "  - PROD_SSH_PRIVATE_KEY (text or file path)"
Write-Host "  - PROD_SSH_PORT (default: 22)"
Write-Host " [Container Runtime Secrets (docker-compose.prod.yml)]"
Write-Host "  - DB_PASSWORD"
Write-Host "  - REDIS_PASSWORD"
Write-Host "  - JWT_KEY"
Write-Host "  - SEED_ADMIN_PASSWORD"
Write-Host ""

function ReadSecret($name, $prompt = $null){
    $text = if ($prompt) { $prompt } else { "Enter value for $name (or press Enter to skip)" }
    $val = Read-Host $text
    return $val
}

function SetEnvSecret($name, $value, $env = "production"){
    if ($value){
        gh secret set $name --repo $slug --env $env --body $value
        Write-Host "  ✓ Set secret: $name ($env)" -ForegroundColor Green
    }
}

# --- Database Secrets ---
Write-Host "--- Database Secrets ---" -ForegroundColor Cyan
$p_db_server = ReadSecret 'PRODUCTION_DB_SERVER'
$p_db_user = ReadSecret 'PRODUCTION_DB_USER'
$p_db_password = ReadSecret 'PRODUCTION_DB_PASSWORD'

SetEnvSecret 'PRODUCTION_DB_SERVER' $p_db_server
SetEnvSecret 'PRODUCTION_DB_USER' $p_db_user
SetEnvSecret 'PRODUCTION_DB_PASSWORD' $p_db_password

# --- SSH Deployment Secrets ---
Write-Host "`n--- SSH Automated Deployment Secrets ---" -ForegroundColor Cyan
$p_ssh_host = ReadSecret 'PROD_SERVER_HOST' 'Enter Production Server IP or Domain (or Enter to skip)'
$p_ssh_user = ReadSecret 'PROD_SERVER_USER' 'Enter Production SSH Username (e.g. root or deploy, or Enter to skip)'
$p_ssh_key_input = ReadSecret 'PROD_SSH_PRIVATE_KEY' 'Enter SSH Private Key or Path to key file (or Enter to skip)'
$p_ssh_port = ReadSecret 'PROD_SSH_PORT' 'Enter SSH Port (press Enter for default 22)'

if ($p_ssh_key_input -and (Test-Path $p_ssh_key_input -PathType Leaf)){
    Write-Host "  Reading SSH private key from file: $p_ssh_key_input" -ForegroundColor Gray
    $p_ssh_key = Get-Content -Raw -Path $p_ssh_key_input
} else {
    $p_ssh_key = $p_ssh_key_input
}

if (-not $p_ssh_port -and ($p_ssh_host -or $p_ssh_user)){
    $p_ssh_port = "22"
}

# Also set at repository level if used across workflows
if ($p_ssh_host){
    gh secret set PROD_SERVER_HOST --repo $slug --body $p_ssh_host
    SetEnvSecret 'PROD_SERVER_HOST' $p_ssh_host
}
if ($p_ssh_user){
    gh secret set PROD_SERVER_USER --repo $slug --body $p_ssh_user
    SetEnvSecret 'PROD_SERVER_USER' $p_ssh_user
}
if ($p_ssh_key){
    gh secret set PROD_SSH_PRIVATE_KEY --repo $slug --body $p_ssh_key
    SetEnvSecret 'PROD_SSH_PRIVATE_KEY' $p_ssh_key
}
if ($p_ssh_port){
    gh secret set PROD_SSH_PORT --repo $slug --body $p_ssh_port
    SetEnvSecret 'PROD_SSH_PORT' $p_ssh_port
}

# --- Container Runtime Secrets ---
Write-Host "`n--- Docker Compose Runtime Secrets ---" -ForegroundColor Cyan
$p_app_db_pw = ReadSecret 'DB_PASSWORD' 'Enter DB_PASSWORD for Docker containers (or Enter to skip)'
$p_redis_pw = ReadSecret 'REDIS_PASSWORD' 'Enter REDIS_PASSWORD for Redis container (or Enter to skip)'
$p_jwt_key = ReadSecret 'JWT_KEY' 'Enter JWT_KEY (min 64 chars, or Enter to skip)'
$p_seed_admin_pw = ReadSecret 'SEED_ADMIN_PASSWORD' 'Enter SEED_ADMIN_PASSWORD for SuperAdmin (or Enter to skip)'

SetEnvSecret 'DB_PASSWORD' $p_app_db_pw
SetEnvSecret 'REDIS_PASSWORD' $p_redis_pw
SetEnvSecret 'JWT_KEY' $p_jwt_key
SetEnvSecret 'SEED_ADMIN_PASSWORD' $p_seed_admin_pw

# Optionally set staging secrets as well
if ($SetStagingSecrets){
    Write-Host "`n--- Staging Secrets ---" -ForegroundColor Yellow
    $s_db_server = ReadSecret 'STAGING_DB_SERVER'
    $s_db_user = ReadSecret 'STAGING_DB_USER'
    $s_db_password = ReadSecret 'STAGING_DB_PASSWORD'
    SetEnvSecret 'STAGING_DB_SERVER' $s_db_server 'staging'
    SetEnvSecret 'STAGING_DB_USER' $s_db_user 'staging'
    SetEnvSecret 'STAGING_DB_PASSWORD' $s_db_password 'staging'
}

Write-Host "`nSecrets configuration completed.`n" -ForegroundColor Green

Write-Host "Manual next steps to configure environment protection and reviewers:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/$slug/settings/environments/production" -ForegroundColor Gray
Write-Host "2. Under 'Protection rules' add required reviewers (team or users) who must approve deployments." -ForegroundColor Gray
Write-Host "3. Optionally enable 'Wait timer' to enforce a delay before deployments." -ForegroundColor Gray
Write-Host "4. Optionally restrict which branches can deploy to production." -ForegroundColor Gray
Write-Host "5. Configure branch protection rules under Settings → Branches if needed." -ForegroundColor Gray

Write-Host "If you want, I can also provide gh api commands to add specific reviewers programmatically."

Write-Host "Done."
