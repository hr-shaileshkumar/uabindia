# 🚀 UabIndia SaaS ERP - Universal Deployment Guide

> **Zero Code Change Architecture**: This codebase is 100% environment-driven (12-Factor App methodology). You can deploy the frontend, backend, database, and cache across any cloud, VPS, or serverless provider **without modifying a single line of code**.

---

## 📋 Table of Contents
1. [Where Can You Deploy? (Deployment Options Matrix)](#1-where-can-you-deploy)
2. [Option A: Any Linux VPS / Dedicated Server (Recommended for Complete SaaS)](#option-a-any-linux-vps--dedicated-server)
3. [Option B: Split Deployment (Vercel Frontend + Cloud Backend)](#option-b-split-deployment-vercel--cloud-backend)
4. [Option C: Fully-Managed PaaS (Railway / Render / Coolify)](#option-c-fully-managed-paas)
5. [Option D: Enterprise Cloud (AWS ECS / Azure App Service / GCP Cloud Run)](#option-d-enterprise-cloud)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Maintenance, Backups & Monitoring](#maintenance-backups--monitoring)

---

## 1. Where Can You Deploy?

| Deployment Model | Frontend | Backend API & Worker | Database & Cache | Typical Cost | Setup Time |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **All-In-One VPS (Docker Compose)** | Docker (Next.js 15) | Docker (.NET 10) | MSSQL 2022 + Redis 7 | $10 - $25/mo | **5 minutes** |
| **Split Deployment (Vercel + VPS)** | Vercel (Edge CDN) | Docker (.NET 10) | MSSQL + Redis | $15 - $30/mo | **10 minutes** |
| **PaaS (Railway / Render)** | Railway / Render Web Service | Railway / Render Web Service | Managed SQL / Redis | Pay-as-you-go | **10 minutes** |
| **Enterprise Cloud (AWS / Azure)** | CloudFront / Static S3 / Azure App | AWS ECS / Azure Container Apps | Azure SQL / RDS + ElastiCache | Scales dynamically | **30 minutes** |

---

## Option A: Any Linux VPS / Dedicated Server
> **Compatible with**: DigitalOcean Droplet, AWS EC2, Hetzner, Linode, Hostinger VPS, OVH, Azure VM, Ubuntu 22.04 / 24.04 LTS.

### 1. Connect to your VPS
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Clone Repository
```bash
git clone https://github.com/hr-shaileshkumar/uabindia.git /opt/uabindia
cd /opt/uabindia
```

### 3. Server Hardening & Preparation (Run Once)
```bash
sudo bash scripts/setup-vps.sh
```
*What this automatically does for you:*
- Configures 4GB Swap file to permanently prevent MSSQL Out-of-Memory (OOM) crashes.
- Configures UFW Firewall: enables ports 22, 80, 443; protects internal database (1433) and Redis (6379).
- Installs Docker Engine & Compose v2 (if not already installed).
- Configures automated daily database backups at 02:00 AM via cron.

### 4. Run the 1-Click Production Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```
*That's it!* The script automatically:
- Generates high-entropy production cryptographic keys (512-bit JWT, AES-256-GCM, DB & Redis passwords).
- Builds Next.js 15 standalone frontend, Vite HRMS portal, .NET 10 Web API, and Hangfire worker.
- Configures Nginx reverse proxy with rate limiting, WebSocket upgrade, and isolated subdomains.

### 5. Setup Free SSL Certificate (Let's Encrypt / Certbot)
```bash
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d *.yourdomain.com
```

---

## Option B: Split Deployment (Vercel + Cloud Backend)
> **Best For**: Maximum global page load speed, free global CDN, and automatic Git previews.

### Part 1: Deploy Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your `uabindia` GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   API_BASE_URL=https://api.yourdomain.com
   NODE_ENV=production
   ```
5. Click **Deploy**. Vercel will build and deploy Next.js with automatic Edge optimization.

### Part 2: Deploy Backend to any Cloud / Docker Host
- Run Backend container pointing to your SQL Server database.
- Next.js automatically rewrites `/api/v1/*` and `/hubs/*` to your backend URL without any CORS errors.

---

## Option C: Fully-Managed PaaS (Railway / Render / Coolify)

### Deploying on Railway.app
1. Go to [Railway.app](https://railway.app) & click **New Project** &rarr; **Deploy from GitHub Repo**.
2. Add a **SQL Server** and **Redis** database service.
3. For **Backend Service**:
   - Set Root Directory: `/Backend`
   - Railway automatically detects the multi-stage `Dockerfile`.
   - Add Environment Variables:
     ```env
     ConnectionStrings__DefaultConnection=Server=sqlserver;Database=UabIndia_Enterprise;User Id=sa;Password=...
     Redis__ConnectionString=redis:...
     Jwt__Key=YOUR_64_CHAR_KEY
     ASPNETCORE_ENVIRONMENT=Production
     ```
4. For **Frontend Service**:
   - Set Root Directory: `/frontend`
   - Add Environment Variable: `API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}`
   - Click Deploy.

---

## Option D: Enterprise Cloud (AWS / Azure)

### Deploying on Azure (Native Home of .NET & SQL Server)
1. **Backend**: Azure Container Apps or Azure App Service (Linux Docker container `Backend/Dockerfile`).
2. **Database**: Azure SQL Database (Serverless or Provisioned).
3. **Cache**: Azure Cache for Redis.
4. **Frontend**: Azure Static Web Apps or Azure App Service (`frontend/Dockerfile`).

### Deploying on AWS
1. **Containers**: AWS ECS with AWS Fargate.
2. **Database**: Amazon RDS for SQL Server.
3. **Cache**: Amazon ElastiCache for Redis.
4. **Reverse Proxy & CDN**: AWS CloudFront + Application Load Balancer (ALB).

---

## Environment Variables Reference

### Backend API Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | Environment mode | `Production` |
| `ConnectionStrings__DefaultConnection` | SQL Server connection string | `Server=sqlserver,1433;Database=UabIndia_Enterprise;...` |
| `Redis__ConnectionString` | Redis cache connection string | `redis:6379,password=...` |
| `Jwt__Key` | HMAC-SHA256 Secret (min 64 chars) | `RandomHighEntropy64CharacterSecretKey...` |
| `Jwt__Issuer` | JWT Token Issuer | `UabIndia_Api` |
| `Jwt__Audience` | JWT Token Audience | `UabIndia_Client` |
| `Cors__AllowedOrigins` | Allowed domains for web clients | `https://uabindia.com,https://*.uabindia.com` |

### Frontend Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Node environment | `production` |
| `NEXT_PUBLIC_API_URL` | Public API endpoint for browser calls | `https://api.yourdomain.com` or relative `/api/v1` |
| `API_BASE_URL` | Internal backend URL for Server-Side Rendering | `http://api:5000` |
| `PORT` | Listening HTTP port | `3000` |

---

## Maintenance, Backups & Monitoring

### Viewing Live Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific container
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Automated Database Backup
```bash
# Manual snapshot (saves to ./backups/)
bash scripts/backup-database.sh
```

### Database Disaster Recovery / Restore
```bash
# Restore from a backup archive
bash scripts/restore-database.sh ./backups/UabIndia_Enterprise_Full_YYYYMMDD_HHMMSS.bak
```

### Stopping or Restarting Services
```bash
# Restart without downtime
docker compose -f docker-compose.prod.yml restart backend frontend

# Stop all containers
docker compose -f docker-compose.prod.yml down
```
