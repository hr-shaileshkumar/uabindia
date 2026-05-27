# ERP Dashboard Wireframe (Project-Centric)

## Objective
Single command center at `/erp/dashboard` showing cross-module health:
- HR health
- Finance health
- Operations health
- Alerts and pending actions

## Layout Wireframe

```mermaid
flowchart TB
  A[Topbar: Company | Project | Search | Notifications | Profile]
  B[Sidebar: Dashboard/HRMS/Finance/Operations/Reports/Admin]
  C[Breadcrumb]
  D[Title + Period Filter + Export]
  E1[KPI: Total Employees]
  E2[KPI: Attendance %]
  E3[KPI: Revenue]
  E4[KPI: Expense]
  F[Cross-Module Insights]
  G1[HR + Payroll: Headcount vs Payroll Cost]
  G2[Inventory + Finance: Stock Value vs Payables]
  H[Project Alerts]
  I[Pending Actions Queue]

  A --> C
  B --> C
  C --> D
  D --> E1
  D --> E2
  D --> E3
  D --> E4
  E1 --> F
  E2 --> F
  E3 --> F
  E4 --> F
  F --> G1
  F --> G2
  G1 --> H
  G2 --> I
```

---

## Section Specification

### 1) Header Controls
- Project selector (required)
- Date range (this month/quarter/custom)
- Export snapshot (PDF/CSV)

### 2) KPI Row (4 cards)
- Total Employees
- Attendance %
- Revenue
- Expense vs Budget

### 3) Cross-Module Insights
- HR + Payroll trend
- Inventory + Finance exposure

### 4) Alerts Panel
- Approvals pending
- Payroll exceptions
- Compliance reminders

### 5) Action Queue
- “Approve Leave Requests”
- “Review Payroll Run”
- “Check Inventory Reorder”

---

## Data Contracts (Frontend expectations)

### KPI Contract
```ts
interface DashboardKpi {
  totalEmployees: number;
  attendancePct: number;
  revenue: number;
  expense: number;
  budget: number;
}
```

### Alerts Contract
```ts
interface DashboardAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  module: "hrms" | "finance" | "operations" | "reports";
  createdAt: string;
}
```

### Action Queue Contract
```ts
interface ActionItem {
  id: string;
  label: string;
  route: string;
  count?: number;
  permission: string;
}
```

---

## UX States
- Loading skeletons for cards/charts
- Empty state when project has no data
- Error panel with retry action

## Permissions
- Dashboard page: `dashboard.view`
- Action cards hidden if permission missing

## Delivery Checklist
- `/erp/dashboard` route active
- KPI + alerts + action queue all responsive
- Company/project context reflected in all API calls
