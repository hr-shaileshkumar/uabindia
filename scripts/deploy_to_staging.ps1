<#
.\scripts\deploy_to_staging.ps1

# Deploy publish/ folder to staging VPS and restart systemd service.
# Usage (PowerShell):
#   $env:STAGING_VPS_USER='user'; $env:STAGING_VPS_HOST='host'; $env:STAGING_VPS_PATH='/var/www/uabindia-staging'; .\scripts\deploy_to_staging.ps1
#
# This script does NOT contain secrets. It expects the SSH private key to be set up in your SSH agent.
#
#>
param(
    [string]$VpsUser = $env:STAGING_VPS_USER,
    [string]$VpsHost = $env:STAGING_VPS_HOST,
    [string]$VpsPath = $env:STAGING_VPS_PATH,
    [string]$PublishDir = "$PSScriptRoot\..\Backend\src\UabIndia.Api\bin\Release\net8.0\publish"
)

if (-not $VpsUser -or -not $VpsHost -or -not $VpsPath) {
    Write-Error "Missing STAGING_VPS_USER, STAGING_VPS_HOST or STAGING_VPS_PATH (pass as args or set env vars)."
    exit 2
}

if (-not (Test-Path $PublishDir)) {
    Write-Error "Publish directory not found: $PublishDir. Run dotnet publish before running this script."
    exit 3
}

Write-Host "Deploying $PublishDir to ${VpsUser}@${VpsHost}:${VpsPath} (staging)"

& rsync -avz --delete "$PublishDir/" "${VpsUser}@${VpsHost}:${VpsPath}/"

Write-Host "Copying staging env file (if present) and restarting systemd service..."
if (Test-Path "$PSScriptRoot\..\Backend\deploy\uabindia_api.env.staging") {
    scp "$PSScriptRoot\..\Backend\deploy\uabindia_api.env.staging" "${VpsUser}@${VpsHost}:/tmp/uabindia_api.env"
    ssh "${VpsUser}@${VpsHost}" "sudo mv /tmp/uabindia_api.env /etc/uabindia_api.env && sudo chown root:root /etc/uabindia_api.env && sudo chmod 600 /etc/uabindia_api.env"
}

ssh "${VpsUser}@${VpsHost}" "sudo systemctl daemon-reload; sudo systemctl restart uabindia-api; sudo systemctl enable uabindia-api"

Write-Host "Staging deploy finished. Follow logs with: ssh ${VpsUser}@${VpsHost} 'sudo journalctl -u uabindia-api -f'"

# EOF
