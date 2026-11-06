# 🚀 UAB India Enterprise Suite (SaaS Standard)

> **Single Source of Truth Specification**: [ERP_ARCHITECTURE_GUIDE.md](ERP_ARCHITECTURE_GUIDE.md)

---

## 📚 Overview

This repository contains the full-stack UAB India Enterprise platform designed for multi-tenant SaaS deployment, including **Finance & Accounting**, **HRMS & Payroll**, **Inventory & Supply Chain**, and **CRM & Sales**.

---

## 🏗️ Architecture & Blueprints

All architectural designs, database schemas, RBAC security matrices, dynamic page archetypes, and multi-tenant rules are defined in the master architecture document:

👉 **[ERP_ARCHITECTURE_GUIDE.md](ERP_ARCHITECTURE_GUIDE.md)**

---

## 🛠️ Stack & Directory Structure

```
UAB India Enterprise/
 ├── ERP_ARCHITECTURE_GUIDE.md  # Master Architecture & Production Blueprint
 ├── frontend/                  # Next.js 15 + React 19 + Tailwind CSS + TanStack Table
 ├── Backend/                   # ASP.NET Core 10 API / Entity Framework Core
 ├── mobile/                    # React Native / Expo Mobile App
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

### Running Mobile App
```bash
cd mobile
npx expo start
```
