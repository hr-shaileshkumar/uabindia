# 01 — Repository Inventory & Technology Stack Discovery

## Executive Summary
This document establishes the baseline inventory of the enterprise multi-tenant ERP system codebase. The repository contains both a high-throughput .NET 10 backend and a modern Next.js / React enterprise frontend.

## Technology Stack Specification

| Tier | Component / Technology | Detected Version | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | .NET Core / ASP.NET Core | **.NET 10.0** Preview / 9 LTS Compatible | REST API, Enterprise Services, Background Workers |
| **ORM / Data Access** | Entity Framework Core | **EF Core 10.0 / 9.0** | Relational Data Mapping, Multi-Tenant Filtering |
| **Database** | Microsoft SQL Server / Azure SQL | Relational / T-SQL | Multi-tenant persistent relational store |
| **Frontend Framework** | Next.js App Router | **Next.js 15.1+** (Targeting Next 16) | Server & Client Component Hybrid Rendering |
| **UI Runtime** | React | **React 19.0.0** | Component lifecycle, Actions, Optimistic UI |
| **Styling** | Tailwind CSS / Lucide Icons | **Tailwind CSS v4** | Design tokens, glassmorphism, responsive UI |
| **State Management** | React Context + TanStack Query / SWR | Custom hooks + API client | Server state caching & mutation sync |
| **Authentication** | JWT + Cookie Session + MFA | Custom Identity + ASP.NET Identity | Multi-tenant ClaimsPrincipal & Session Guards |

## Frontend vs. Backend Metrics

```
Total Frontend Pages:         192 pages (App Router)
Total Backend Controllers:    108 controllers
Total Backend Endpoints:      542 REST API endpoints
Total Database DbSets:        172 DbSets (ApplicationDbContext)
Total Entity Models:          124 Domain Models
Total Core Modules:           18 Functional Domains
```

## Physical Directory Structure

```text
Uabindia/
├── Backend/
│   ├── src/
│   │   ├── Modules/                   # 15 Vertical Functional Modules
│   │   │   ├── Administration/        # Tenant, Company, Org Hierarchy, Users, Roles, UI Schema
│   │   │   ├── Assets/                # Fixed Assets, Depreciation, Fleet
│   │   │   ├── Compliance/            # Statutory Compliance & Audits
│   │   │   ├── CRM/                   # Leads, Customer Relations
│   │   │   ├── Finance/               # Chart of Accounts, Journals, Invoicing, Payments, Tax
│   │   │   ├── HRMS/                  # Employees, Attendance, Shifts, Leaves, Appraisals
│   │   │   ├── Inventory/             # Items, Warehouses, Stock Movement, Transfers
│   │   │   ├── Manufacturing/         # Work Orders, Bills of Materials (BOM), MRP
│   │   │   ├── Notifications/         # In-App Notifications, Communication Templates
│   │   │   ├── Payroll/               # Pay Runs, Payslips, Allowances, PF/ESI
│   │   │   ├── Procurement/           # Purchase Orders, RFQ, GRN, Vendors
│   │   │   ├── Projects/              # Project Master, WBS Tasks, Timesheets, Field Service
│   │   │   ├── Reports/               # Cross-cutting tabular & analytical reporting
│   │   │   ├── Sales/                 # Quotations, Sales Orders, Discount Schemes, Returns
│   │   │   └── Workflow/              # Approval Chains, Engine, State Machine
│   │   ├── UabIndia.Api/              # Host Web API, Middlewares, Dependency Injection
│   │   ├── UabIndia.Application/      # Use Cases, DTOs, CQRS Handlers, Validation
│   │   ├── UabIndia.Billing/          # Tenant SaaS Subscriptions & Invoicing
│   │   ├── UabIndia.Core/             # Base Entities, Domain Events, Shared Interfaces
│   │   ├── UabIndia.Identity/         # Authentication, Token Providers, MFA, SSO
│   │   ├── UabIndia.Infrastructure/   # ApplicationDbContext, Migrations, External Gateways
│   │   └── UabIndia.SharedKernel/     # Domain Primitives, Specifications, Guard Clauses
│   └── tests/
│       └── UabIndia.Tests/            # Unit & Integration Tests
│
├── frontend/
│   ├── src/
│   │   ├── app/                       # 192 Next.js App Router Pages
│   │   │   ├── (auth)/                # Login, Register, Forgot Password, OTP Verification
│   │   │   ├── (marketing)/           # Public Landing, Pricing, Industries, Solutions
│   │   │   └── (protected)/           # Authenticated ERP Business Shell & Workspaces
│   │   ├── components/                # Reusable UI Atoms, Molecules, Organisms
│   │   │   ├── dynamic/               # Metadata-driven Dynamic Renderer (Table, Form, Filter)
│   │   │   ├── shared/                # ErpPageShell, Table, FilterBar, Modal, Drawers
│   │   │   └── ui/                    # Base Buttons, Inputs, Cards, Badges, Tabs
│   │   ├── hooks/                     # Custom Data Fetching & Table Hooks (useErpListView)
│   │   ├── lib/                       # Utilities, API Client, Navigation, Workspace Registry
│   │   │   ├── workspace/             # Module Registry, Route Config, Navigation Tree
│   │   │   └── ui-schema/             # Schema Engine Types & Serialization
│   │   ├── constants/                 # Route Constants, Permission Keys
│   │   └── types/                     # Shared TypeScript Interfaces
│   └── middleware.ts                  # Edge Tenant Routing, Auth Session & Canonical Redirects
```
