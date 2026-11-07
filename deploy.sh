#!/usr/bin/env bash
# ==============================================================================
# UabIndia SaaS ERP - 1-Click Universal Deployment Script
# Deploys Backend, Frontend, Redis, SQL Server, and Nginx without code changes.
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🚀 UabIndia SaaS ERP - Universal Production Deployment${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Check prerequisites
echo -e "${YELLOW}--> Checking system prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed. Run 'sudo bash scripts/setup-vps.sh' first. Aborting.${NC}" >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose v2 is required but not installed. Aborting.${NC}" >&2; exit 1; }

# Architecture Check (MSSQL 2022 container requires AMD64/x86_64)
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ] && [ "$ARCH" != "amd64" ]; then
    echo -e "${YELLOW}⚠️ WARNING: Host architecture is '${ARCH}'. Microsoft SQL Server 2022 container requires an x86_64/AMD64 CPU.${NC}"
fi

# Memory & Swap Check
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "8000000")
SWAP_TOTAL_KB=$(grep SwapTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "0")
TOTAL_MEM_MB=$((TOTAL_MEM_KB / 1024))

if [ "$TOTAL_MEM_MB" -lt 3800 ] && [ "$SWAP_TOTAL_KB" -lt 1000000 ]; then
    echo -e "${YELLOW}⚠️ WARNING: Detected ${TOTAL_MEM_MB}MB RAM and no active Swap file.${NC}"
    echo -e "${YELLOW}   MSSQL and Next.js builds may crash from Out-Of-Memory (OOM).${NC}"
    echo -e "${YELLOW}   Run 'sudo bash scripts/setup-vps.sh' to configure a 4GB Swap file automatically.${NC}"
fi

echo -e "${GREEN}✅ System prerequisites checked.${NC}"

# 2. Check / Generate .env.production & sync .env
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}--> .env.production not found. Generating secure production secrets...${NC}"
    if [ -f "scripts/generate-production-secrets.sh" ]; then
        chmod +x scripts/generate-production-secrets.sh
        ./scripts/generate-production-secrets.sh
    else
        echo -e "${YELLOW}Creating .env.production from .env.production.example...${NC}"
        cp .env.production.example .env.production
    fi
fi

# Ensure .env is always synced with .env.production for Docker Compose CLI commands
cp -f .env.production .env 2>/dev/null || true

# 3. Create persistent host directories
mkdir -p backups certbot/conf certbot/www uploads
chmod 755 backups uploads

echo -e "${GREEN}✅ Environment configuration loaded (.env.production).${NC}"

# 4. Pull / Build & Launch Containers with production env-file
echo -e "${YELLOW}--> Building and starting containers via docker-compose.prod.yml...${NC}"
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 5. Wait for services to stabilize
echo -e "${YELLOW}--> Waiting for services to become healthy (20 seconds)...${NC}"
sleep 20

# 6. Health Check
echo -e "${YELLOW}--> Checking service health...${NC}"
docker compose --env-file .env.production -f docker-compose.prod.yml ps

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}🎉 UabIndia ERP deployed successfully without any code modifications!${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Web Portal:        http://localhost"
echo -e "HRMS Portal:       http://localhost/hrms/"
echo -e "REST API Docs:     http://localhost/swagger"
echo -e "Health Endpoint:   http://localhost/health"
echo -e ""
echo -e "View live logs:    docker compose -f docker-compose.prod.yml logs -f"
echo -e "Create DB backup:  bash scripts/backup-database.sh"
echo -e "Stop platform:     docker compose -f docker-compose.prod.yml down"
echo -e "${BLUE}======================================================================${NC}"
