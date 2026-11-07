#!/usr/bin/env bash
# ==============================================================================
# UabIndia SaaS ERP - Ubuntu VPS Server Hardening & Preparation Script
# 
# What this script does:
# 1. Configures 4GB Swap file to prevent MSSQL/Build Out-of-Memory (OOM) crashes.
# 2. Configures UFW Firewall (Allows 22/SSH, 80/HTTP, 443/HTTPS; blocks raw DB ports).
# 3. Installs Docker CE & Docker Compose v2 (if not already installed).
# 4. Sets up Automated Daily Database Backup Cron Job (2:00 AM daily).
# 5. Enables Docker service on boot.
#
# Usage: sudo bash scripts/setup-vps.sh
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root (or with sudo). Aborting.${NC}" >&2
    exit 1
fi

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🛡️  UabIndia SaaS ERP - VPS Server Hardening & Preparation${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. CPU Architecture Verification
ARCH=$(uname -m)
echo -e "${YELLOW}--> Verifying CPU Architecture (${ARCH})...${NC}"
if [ "$ARCH" != "x86_64" ] && [ "$ARCH" != "amd64" ]; then
    echo -e "${RED}⚠️ WARNING: MSSQL 2022 containers require an x86_64/AMD64 CPU architecture.${NC}"
    echo -e "${RED}   Current architecture is ${ARCH}. Please ensure you are using an Intel/AMD VPS.${NC}"
else
    echo -e "${GREEN}✅ x86_64 CPU architecture confirmed.${NC}"
fi

# 2. Configure 4GB Swap File (Prevents OOM Crashes on 4GB-8GB VPS)
echo -e "${YELLOW}--> Checking Swap configuration...${NC}"
CURRENT_SWAP=$(swapon --show | wc -l)
if [ "$CURRENT_SWAP" -le 1 ]; then
    echo -e "${YELLOW}--> Creating 4GB Swap file at /swapfile...${NC}"
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    sysctl vm.swappiness=10
    if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
        echo 'vm.swappiness=10' >> /etc/sysctl.conf
    fi
    echo -e "${GREEN}✅ 4GB Swap space enabled and made persistent.${NC}"
else
    echo -e "${GREEN}✅ Swap is already configured.${NC}"
fi

# 3. Configure UFW Firewall (Shield raw MSSQL & Redis from Internet)
echo -e "${YELLOW}--> Configuring UFW Firewall...${NC}"
if command -v ufw >/dev/null 2>&1; then
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw --force enable
    echo -e "${GREEN}✅ Firewall active: Ports 22, 80, 443 allowed. Port 1433 & 6379 protected.${NC}"
else
    echo -e "${YELLOW}Installing and enabling ufw...${NC}"
    apt-get update -y && apt-get install -y ufw
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo -e "${GREEN}✅ UFW Firewall installed and configured.${NC}"
fi

# 4. Install Docker & Docker Compose v2 (if not installed)
echo -e "${YELLOW}--> Checking Docker installation...${NC}"
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}--> Installing official Docker Engine...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    echo -e "${GREEN}✅ Docker Engine installed and started.${NC}"
else
    systemctl enable --now docker
    echo -e "${GREEN}✅ Docker is already installed.${NC}"
fi

# 5. Setup Automated Daily Database Backup Cron Job
echo -e "${YELLOW}--> Setting up Automated Daily Database Backup Cron Job...${NC}"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${CURRENT_DIR}/scripts/backup-database.sh"

if [ -f "$BACKUP_SCRIPT" ]; then
    chmod +x "$BACKUP_SCRIPT"
    CRON_FILE="/etc/cron.d/uabindia-db-backup"
    cat <<EOF > "$CRON_FILE"
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# Run backup everyday at 02:00 AM
0 2 * * * root ${BACKUP_SCRIPT} >> /var/log/uabindia_backup.log 2>&1
EOF
    chmod 644 "$CRON_FILE"
    echo -e "${GREEN}✅ Automated backup cron job configured (Daily at 02:00 AM).${NC}"
    echo -e "   Log file: /var/log/uabindia_backup.log"
fi

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}🎉 VPS Server Hardening & Preparation Complete!${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Next Step:"
echo -e "Run ${YELLOW}./deploy.sh${NC} to start your production ERP stack."
echo -e "${BLUE}======================================================================${NC}"

