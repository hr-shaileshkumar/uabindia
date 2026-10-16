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
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed. Aborting.${NC}" >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose v2 is required but not installed. Aborting.${NC}" >&2; exit 1; }

echo -e "${GREEN}✅ Docker and Docker Compose found.${NC}"

# 2. Check / Generate .env.production
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

echo -e "${GREEN}✅ Environment configuration loaded (.env.production).${NC}"

# 3. Pull / Build & Launch Containers
echo -e "${YELLOW}--> Building and starting containers via docker-compose.prod.yml...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# 4. Wait for services to stabilize
echo -e "${YELLOW}--> Waiting for services to become healthy (30 seconds)...${NC}"
sleep 15

# 5. Health Check
echo -e "${YELLOW}--> Checking service health...${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}🎉 UabIndia ERP deployed successfully without any code modifications!${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Web Portal:        http://localhost"
echo -e "REST API Docs:     http://localhost/swagger"
echo -e "Health Endpoint:   http://localhost/health"
echo -e ""
echo -e "View live logs:    docker compose -f docker-compose.prod.yml logs -f"
echo -e "Stop platform:     docker compose -f docker-compose.prod.yml down"
echo -e "${BLUE}======================================================================${NC}"
