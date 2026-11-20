# 🚀 UAB India Enterprise Suite (SaaS Standard)

> **Master Architecture & Specifications**: [docs/MODULAR_ARCHITECTURE_GUIDE.md](docs/MODULAR_ARCHITECTURE_GUIDE.md)  
> **Production Operations & Deployment**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## 📚 Overview

This repository contains the full-stack **UAB India Enterprise ERP & HRMS platform** designed for multi-tenant cloud SaaS deployment. The suite unifies:
- **Finance & Accounting** (General Ledger, Invoicing, Tax, Double-Entry Reconciliation)
- **HRMS & Payroll** (Workforce Core, Muster Roll, Biometrics, Leaves, Indian Statutory PF/ESIC/PT/TDS, ATS Kanban)
- **Supply Chain & Inventory** (Warehouses, Landed Cost, Purchase Orders, Valuation)
- **CRM & Sales** (Pipelines, Customers, Quotations, Sales Orders)
- **Administration & Security** (RBAC, Multi-Tenant Subdomains, Audit Logs)

---

## 🛠️ Stack & Directory Structure

```text
UabIndia Enterprise/
 ├── Backend/              # ASP.NET Core 10 Web API + Worker (C# 13, EF Core 10, SQL Server)
 ├── frontend/             # Next.js 15.3 (App Router), React 19, TypeScript, Tailwind CSS v4
 ├── docs/                 # Architecture specifications, deployment manuals, audit reports
 ├── nginx/                # Production reverse proxy and SSL configuration
 ├── scripts/              # Automation, database backup/restore, environment switcher
 ├── start-platform.ps1    # 1-Click local development launcher
 ├── docker-compose.yml    # Development & test container orchestrator
 ├── docker-compose.prod.yml # High-concurrency production stack
 ├── package.json          # Unified npm lifecycle scripts
 └── UabIndia.sln          # Master .NET 10 solution file
```

---

## ⚡ Quick Start (Local Development)

### 1-Click Platform Launch (Windows)
```powershell
.\start-platform.ps1
```
This automatically starts:
- **Backend API**: `http://localhost:5000` (Swagger: `http://localhost:5000/swagger`)
- **Enterprise Web Portal**: `http://localhost:3000`

### Manual Execution

#### 1. Backend (.NET 10)
```bash
dotnet run --project Backend/src/UabIndia.Api/UabIndia.Api.csproj
# Or with hot-reload:
npm run api:watch
```

#### 2. Frontend (Next.js 15)
```bash
cd frontend
npm install
npm run dev
# Or from root:
npm run dev
```

---

## 🧪 Testing & Code Quality

```bash
# Typecheck TypeScript
npm run typecheck

# Run Frontend Vitest Suite
npm run test

# Build Frontend Production Bundle
npm run build

# Run Backend .NET Suite
dotnet test UabIndia.sln
```

---

## 🚀 Production Deployment

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for full instructions:
```powershell
# Windows
.\scripts\deploy.ps1

# Linux / macOS
bash scripts/deploy.sh
```
