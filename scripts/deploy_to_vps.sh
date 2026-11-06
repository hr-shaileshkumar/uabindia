#!/usr/bin/env bash
# scripts/deploy_to_vps.sh
# Deploy publish/ folder to production VPS and restart systemd service.
# Usage: VPS_USER=user VPS_HOST=host VPS_PATH=/var/www/uabindia ./scripts/deploy_to_vps.sh

set -euo pipefail

VPS_USER=${VPS_USER:-}
VPS_HOST=${VPS_HOST:-}
VPS_PATH=${VPS_PATH:-}
PUBLISH_DIR="$(pwd)/Backend/src/UabIndia.Api/bin/Release/net8.0/publish"

if [ -z "$VPS_USER" ] || [ -z "$VPS_HOST" ] || [ -z "$VPS_PATH" ]; then
  echo "Missing VPS_USER, VPS_HOST or VPS_PATH environment variables"
  exit 2
fi

if [ ! -d "$PUBLISH_DIR" ]; then
  echo "Publish directory not found: $PUBLISH_DIR. Run dotnet publish before running this script."
  exit 3
fi

echo "Deploying $PUBLISH_DIR to $VPS_USER@$VPS_HOST:$VPS_PATH"
rsync -avz --delete "$PUBLISH_DIR/" "$VPS_USER@$VPS_HOST:$VPS_PATH/"

echo "Copying production env file if present and restarting service"
if [ -f "Backend/deploy/uabindia_api.env" ]; then
  scp Backend/deploy/uabindia_api.env "$VPS_USER@$VPS_HOST:/tmp/uabindia_api.env"
  ssh "$VPS_USER@$VPS_HOST" "sudo mv /tmp/uabindia_api.env /etc/uabindia_api.env && sudo chown root:root /etc/uabindia_api.env && sudo chmod 600 /etc/uabindia_api.env"
fi

ssh "$VPS_USER@$VPS_HOST" "sudo systemctl daemon-reload; sudo systemctl restart uabindia-api; sudo systemctl enable uabindia-api"

echo "Production deploy complete. Tail logs with: ssh $VPS_USER@$VPS_HOST 'sudo journalctl -u uabindia-api -f'"