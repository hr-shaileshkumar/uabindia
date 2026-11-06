<#
.\scripts\deploy_to_vps.ps1

# Deploy publish/ folder to VPS and restart systemd service.
# Usage (PowerShell):
#   $env:VPS_USER='user'; $env:VPS_HOST='host'; $env:VPS_PATH='/var/www/uabindia'; .\scripts\deploy_to_vps.ps1
# Or pass as parameters: .\scripts\deploy_to_vps.ps1 -VpsUser user -VpsHost host -VpsPath /var/www/uabindia
#
# This script does NOT contain secrets. It expects the SSH private key to be set up in your SSH agent
# or available via the environment (used by GitHub Actions in CI).
#
#>
param(
    [string]$VpsUser = $env:VPS_USER,
    [string]$VpsHost = $env:VPS_HOST,
    [string]$VpsPath = $env:VPS_PATH,
    [string]$PublishDir = "$PSScriptRoot\..\Backend\src\UabIndia.Api\bin\Release\net8.0\publish"
)

if (-not $VpsUser -or -not $VpsHost -or -not $VpsPath) {
    Write-Error "Missing VPS_USER, VPS_HOST or VPS_PATH (pass as args or set env vars)."
    exit 2
}

if (-not (Test-Path $PublishDir)) {
    Write-Error "Publish directory not found: $PublishDir. Run dotnet publish before running this script."
    exit 3
}

Write-Host "Deploying $PublishDir to ${VpsUser}@${VpsHost}:${VpsPath}"

& rsync -avz --delete "$PublishDir/" "${VpsUser}@${VpsHost}:${VpsPath}/"

Write-Host "Copying env file (if present) and restarting systemd service..."
if (Test-Path "$PSScriptRoot\..\Backend\deploy\uabindia_api.env") {
    scp "$PSScriptRoot\..\Backend\deploy\uabindia_api.env" "${VpsUser}@${VpsHost}:/tmp/uabindia_api.env"
    ssh "${VpsUser}@${VpsHost}" "sudo mv /tmp/uabindia_api.env /etc/uabindia_api.env && sudo chown root:root /etc/uabindia_api.env && sudo chmod 600 /etc/uabindia_api.env"
}

ssh "${VpsUser}@${VpsHost}" "sudo systemctl daemon-reload; sudo systemctl restart uabindia-api; sudo systemctl enable uabindia-api"

Write-Host "Deploy finished. Follow logs with: ssh ${VpsUser}@${VpsHost} 'sudo journalctl -u uabindia-api -f'"
