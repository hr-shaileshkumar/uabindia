# Uabindia HRMS — Modern Enterprise SaaS Client Portal

A standalone, metadata-driven, high-performance **Human Resources Management System (HRMS)** and **People Operations SaaS** built for enterprise clients.

Designed to connect with the unified **Uabindia Backend API** (`/api/v1/...`) with zero client-side friction, complete metadata catalog parity, and a modern SaaS UI/UX.

---

## 🌟 Key Architecture & Capabilities

### 1. Pure HRMS Scope
Exclusively delivers workforce and people operations to clients without ERP/CRM/Manufacturing overhead:
* **HR Executive Cockpit**: Live workforce stats, daily muster roll presence, active requisitions, payroll burn, and upcoming employee celebrations.
* **Workforce & Directory**: Comprehensive employee directory, 360° dossiers, salary structures, statutory documentation, and asset management.
* **Time & Attendance**: Daily clock logs, Geofenced duty punches with radius validation, shifts & rotational rosters, overtime tracking, and Form 25 statutory Muster Roll.
* **Leave Management**: Leave requests, quota balances (Casual, Sick, Privilege, Maternity), and manager approval workflows.
* **Talent Acquisition (ATS)**: Job requisitions, candidate ATS visual Kanban pipeline, staffing headcount budgets, interview schedules, and panel scorecards.
* **Employee Lifecycle**: New joiner onboarding checklists, resignation and exit clearance (F&F), and probation confirmation evaluations.
* **Performance & Learning**: 360° PMS appraisals, corporate training courses, post-training assessments, and employee certifications.
* **Travel & Expenses**: Business travel requests and per diem expense claim settlements.
* **Organization Hierarchy**: Departments, Designations, Grade Master (L1–E1), Employment Types, 7-Level Location Hierarchy (Country down to Geofenced Station), and Interactive Org Chart.
* **Payroll & Compensation**: 4-Step Unified Payroll Run Wizard, individual printable/downloadable payslips, and statutory deductions (EPF, ESI, PT, TDS).
* **Self-Service Portals**: Dedicated Employee Self-Service (ESS) and Manager Self-Service (MSS) approval portals.

---

### 2. Metadata Catalog & Dynamic Engine
Powered by `src/metadata/hrmsCatalog.js` directly cross-compatible with the main ERP:
* Every schema defines `pageKey`, `title`, `entityName`, `columns`, `filters`, `form`, `workflowConfig`, and `kpis`.
* Generic `DynamicHrmsPage` engine renders tables, card grids, slide-over detail drawers, and form modals automatically.
* Full sorting, multi-attribute search, status filters, CSV export, and workflow state transitions.

---

### 3. Backend API Parity & Dual-Mode Resilience
* **Axios API Client (`src/api/client.js`)**:
  - Connects to `/api/v1` with Vite dev proxy pointing to `http://127.0.0.1:5000` (or `VITE_API_BASE_URL`).
  - Auto-injects `Authorization: Bearer <token>`, `X-Tenant-Subdomain`, and device identifiers.
* **Resilient Dual-Mode Service (`src/services/hrmsService.js`)**:
  - If backend is online, makes real REST requests to backend controllers.
  - If backend is offline or unseeded, automatically serves and persists rich enterprise mock data in `localStorage`.
  - The client application **never crashes or blocks on network failures**.

---

### 4. Enterprise SaaS UX & Productivity
* **Command Palette (`Cmd+K` / `Ctrl+K`)**: Rapid search across all HRMS submodules and instant employee lookup.
* **Quick Action Button**: Instant 1-click modal for New Employee, Apply Leave, Clock In, Post Opening, or Run Payroll.
* **1-Click Demo Persona Switcher**: Switch instantly between HR Admin, Engineering Manager, Recruiter, and Employee.
* **Modern Aesthetic**: Neutral slate/zinc palette, vibrant indigo accents, custom scrollbars, and dedicated `@media print` stylesheets for payslips.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ (tested on Node 20 / 22 / 24)
* npm or pnpm

### Installation
```bash
# From workspace root
cd frontend-hrms
npm install
```

### Development Server
```bash
npm run dev
```
* Runs by default on `http://localhost:3001`
* Proxies `/api` to the backend on `http://127.0.0.1:5000`

### Production Build
```bash
npm run build
```
Generates an optimized, tree-shaken static production bundle in `dist/`.

---

## 📁 Directory Structure

```
frontend-hrms/
├── src/
│   ├── api/
│   │   └── client.js              # Production Axios client with interceptors
│   ├── context/
│   │   ├── AuthContext.jsx        # Auth state, tenant subdomain, demo personas
│   │   └── NotificationContext.jsx# Toast notification system
│   ├── metadata/
│   │   ├── hrmsCatalog.js         # Master schemas for all 25+ HRMS/Payroll pages
│   │   └── navigation.js          # Hierarchical SaaS navigation structure
│   ├── services/
│   │   ├── hrmsService.js         # Dual-mode service with fallback cache
│   │   └── mockData.js            # Realistic enterprise Indian dataset
│   ├── components/common/
│   │   ├── DataTable.jsx          # Sortable, paginated high-density table
│   │   ├── DynamicHrmsPage.jsx    # Metadata-driven page view engine
│   │   ├── DynamicFormModal.jsx   # Sectioned form modal with validation
│   │   ├── RecordDrawer.jsx       # Side-drawer record inspector
│   │   ├── StatusBadge.jsx        # Status pills with semantic tones
│   │   ├── CommandPalette.jsx     # Cmd+K global search
│   │   ├── QuickActionModal.jsx   # Rapid operation shortcuts
│   │   └── Breadcrumbs.jsx        # Hierarchical breadcrumb navigation
│   ├── layout/
│   │   ├── AppLayout.jsx          # Master responsive layout shell
│   │   ├── Sidebar.jsx            # Collapsible categorized sidebar
│   │   └── Topbar.jsx             # Topbar with tenant pill, search, actions
│   ├── modules/
│   │   ├── dashboard/             # Executive HR Dashboard Cockpit
│   │   ├── employees/             # Directory & 360 Dossier
│   │   ├── attendance/            # Daily punches & Monthly Muster Roll
│   │   ├── leaves/                # Quotas & Leave Applications
│   │   ├── recruitment/           # Job Openings & ATS Pipeline Kanban
│   │   ├── lifecycle/             # Workforce movement & succession
│   │   ├── organization/          # Departments, Designations, 7-Tier Locations, Org Tree
│   │   ├── payroll/               # 4-Step Payroll Run Wizard & Payslips
│   │   ├── selfservice/           # ESS & MSS Portals
│   │   └── dynamic/               # Generic schema route runner
│   ├── pages/
│   │   ├── Login.jsx              # SaaS login with 1-click persona buttons
│   │   └── NotFound.jsx           # 404 handler
│   ├── App.jsx                    # Complete route registry (25+ submodules)
│   ├── index.css                  # Tailwind styles & print stylesheet
│   └── main.jsx                   # Entry point
```
