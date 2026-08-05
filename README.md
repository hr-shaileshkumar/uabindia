# 🚀 Enterprise ERP System (SaaS Standard)

> **Single Source of Truth Specification**: [ERP_ARCHITECTURE_GUIDE.md](ERP_ARCHITECTURE_GUIDE.md)

---

## 📚 Overview

This repository contains the full-stack Enterprise Resource Planning (ERP) system designed for multi-tenant SaaS deployment, including **Finance & Accounting**, **HRMS & Payroll**, **Inventory & Supply Chain**, and **CRM & Sales**.

---

## 🏗️ Architecture & Blueprints

All architectural designs, database schemas, RBAC security matrices, UI layout blueprints, and multi-tenant rules are defined in the master architecture document:

👉 **[ERP_ARCHITECTURE_GUIDE.md](ERP_ARCHITECTURE_GUIDE.md)**

---

## 🛠️ Stack & Directory Structure

```
ERP System/
 ├── ERP_ARCHITECTURE_GUIDE.md  # Master Architecture & Production Blueprint
 ├── frontend/                  # Next.js 16 + React 19 + Tailwind CSS + TanStack Table
 ├── Backend/                   # ASP.NET Core 8 API / Entity Framework Core
 └── package.json               # Root scripts
```

### Running Frontend
```bash
cd frontend
npm install
npm run dev
```

### Running Backend
```bash
cd Backend/src/UabIndia.Api
dotnet run
```