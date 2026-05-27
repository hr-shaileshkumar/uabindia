# ERP System — Senior Developer Master Plan
> Full-stack analysis, gap identification, and phased implementation roadmap

---

## 1. PROJECT OVERVIEW (Current State)

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 8, Clean Architecture (Core / Application / Infrastructure / Identity / API) |
| Database | SQL Server, Entity Framework Core, per-tenant schema isolation |
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Auth | JWT (15 min) + Refresh Token (30 days), HttpOnly cookies |
| Background Jobs | Hangfire + SQL Server |
| Monitoring | Sentry, Application Insights |
| Mobile | React Native (Expo) |

### Module Inventory
| Module Key | Backend Controllers | Frontend Pages | Status |
|-----------|-------------------|----------------|--------|
| **erp** | ChartOfAccounts, JournalEntries, Payments, Customers, Sales, Vendors, Purchase, Items, Warehouses, StockMovements | ✅ All pages exist | Partial UI |
| **hrms** | Employees, Attendance, Leave, Shifts, Overtime, Recruitment, Training, Performance, Assets | ✅ All pages exist | Partial UI |
| **payroll** | Payroll, Payslips, PayrollStructures, PayrollComponents, Statutory | ✅ All pages exist | Partial UI |
| **reports** | Reports | ✅ Page exists | Stub |
| **platform** | Users, Roles, Companies, Tenants, Settings, Modules | ✅ Pages exist | Partial |
| **licensing** | Licensing | ✅ Page exists | Stub |
| **security** | Security, AuditLogs | ✅ Page exists | Partial |

---

## 2. CRITICAL GAPS IDENTIFIED

### GAP 1: SuperAdmin bypass incomplete on backend
**Problem:** `ModuleEnabledHandler.cs` does NOT bypass module checks for SuperAdmin/IsSystemAdmin users. If a module is disabled for a tenant, even the SuperAdmin gets blocked.

**Fix Required:** In `ModuleEnabledHandler.cs`, add:
```csharp
// Add early bypass for SuperAdmin
if (context.User.IsInRole("SuperAdmin") || context.User.IsInRole("SystemAdmin"))
{
    context.Succeed(requirement);
    return;
}
```
Also add `IsSystemAdmin` claim check in the JWT validation. This is the **most critical fix**.

### GAP 2: `/auth/permissions` returns `mode: "enforced"` for everyone
**Problem:** Even SuperAdmin gets `mode: "enforced"` instead of `mode: "open"`, which means the frontend enforces permission checks. The SuperAdmin should get `mode: "open"` OR all permissions wildcard. Currently `"*"` is added to permissions list but frontend's `hasPermission()` does not handle `"*"` wildcard.

**Fix Required:**
- Backend: Return `mode: "open"` for `IsSystemAdmin` users
- Frontend `PermissionContext.tsx`: Handle `"*"` wildcard to bypass all checks

### GAP 3: No differentiated frontend per role
**Problem:** All roles (SuperAdmin, Admin, Employee, Manager etc.) see the same sidebar and dashboard layout. The frontend should render different experiences.

**Required Architecture:**
- **SuperAdmin**: Full system management UI — all tenants, all modules, system settings, schema management, audit logs
- **Admin**: Company-level management — users, roles, all ERP modules, reports
- **Other Roles (HR Manager, Accountant, Employee, etc.)**: Only their permitted pages, no admin menus

### GAP 4: No dynamic schema/column management
**Problem:** To add a new column to an Employee record or any entity, a developer must write EF migrations and redeploy. This breaks the requirement "database column add/remove easily in deployed project."

**Solution Required:** `EntityFieldDefinitions` table — a metadata-driven custom fields system allowing SuperAdmin to define extra fields per entity. Frontend renders these dynamically.

### GAP 5: Module pages are mostly stubs / incomplete UI
Many pages exist as file structures (`/hrms/overtime/page.tsx`) but the actual CRUD UI, forms, modals, and table components are either stubs or incomplete.

### GAP 6: No seeded permission matrix
Permissions exist in the DB (`Permissions` table) but there's no comprehensive seeder that creates all `module:action` permission keys for all modules. `PolicySeeder.cs` exists but needs validation.

### GAP 7: ERP Dashboard is generic
The dashboard does not show role-specific widgets. SuperAdmin should see system health, Admin should see business KPIs, Employee should see their personal data (attendance, leave, payslip).

---

## 3. ARCHITECTURE DECISIONS

### 3.1 Role Hierarchy
```
SuperAdmin (IsSystemAdmin = true)
  └── ALL access, no permission checks, system-wide
      ├── Can manage all tenants
      ├── Can enable/disable modules per tenant
      └── Sees system admin dashboard

Admin (Role: "Admin" or "SuperAdmin" role in tenant)
  └── Full tenant-level access
      ├── Manage users, roles, permissions
      ├── Configure modules and settings
      └── Sees admin dashboard with business metrics

Other Roles (HR Manager, Accountant, Manager, Employee...)
  └── Permission-gated access only
      ├── Can only see/do what permissions allow
      └── Sees personalized dashboard
```

### 3.2 Frontend Architecture (Role-Based Layout)
```
/app/(protected)/layout.tsx  ← detects role, renders correct shell
    ├── SuperAdminShell.tsx  ← system-wide management UI
    ├── AdminShell.tsx       ← tenant admin UI
    └── UserShell.tsx        ← standard employee UI
```

### 3.3 Dynamic Fields Architecture
```sql
CREATE TABLE EntityFieldDefinitions (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TenantId       UNIQUEIDENTIFIER NOT NULL,
    EntityName     NVARCHAR(100) NOT NULL,  -- 'Employee', 'Vendor', etc.
    FieldKey       NVARCHAR(100) NOT NULL,
    FieldLabel     NVARCHAR(200) NOT NULL,
    FieldType      NVARCHAR(50) NOT NULL,   -- 'text','number','date','select','boolean'
    IsRequired     BIT NOT NULL DEFAULT 0,
    Options        NVARCHAR(MAX) NULL,      -- JSON for select options
    DisplayOrder   INT NOT NULL DEFAULT 0,
    IsActive       BIT NOT NULL DEFAULT 1,
    CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted      BIT NOT NULL DEFAULT 0
);

CREATE TABLE EntityFieldValues (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TenantId        UNIQUEIDENTIFIER NOT NULL,
    FieldDefinitionId UNIQUEIDENTIFIER NOT NULL,
    EntityId        UNIQUEIDENTIFIER NOT NULL,  -- FK to any entity
    Value           NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2 NULL,
    IsDeleted       BIT NOT NULL DEFAULT 0
);
```
This allows adding/removing fields without touching the database schema. Zero downtime.

### 3.4 Backend API Control of Frontend UI
The existing `UiShellController` pattern is correct and must be the source of truth:
- `/api/v1/ui-shell/navigation` → sidebar menu items
- `/api/v1/ui-shell/route-rules` → which routes need which permissions
- `/api/v1/ui-shell/dashboard` → dashboard widget definitions
- `/api/v1/ui-shell/page-schema/{pageKey}` → page form schemas (including dynamic fields)

---

## 4. PHASED IMPLEMENTATION PLAN

---

### PHASE 1: CRITICAL FIXES (Do First — 1-2 days)
These are bugs that affect the entire system correctness.

#### 1.1 Fix SuperAdmin bypass in ModuleEnabledHandler
**File:** `Backend/src/UabIndia.Api/Authorization/ModuleEnabledHandler.cs`
```csharp
protected override async Task HandleRequirementAsync(...)
{
    // SuperAdmin bypasses all module checks
    if (context.User.IsInRole("SuperAdmin") || context.User.IsInRole("SystemAdmin"))
    {
        context.Succeed(requirement);
        return;
    }
    // ... existing logic
}
```

#### 1.2 Fix permissions endpoint for SuperAdmin
**File:** `Backend/src/UabIndia.Api/Controllers/AuthController.cs` (permissions endpoint)
```csharp
if (user?.IsSystemAdmin == true)
{
    return Ok(new { mode = "open", permissions = new[] { "*" } }); // open mode = no gating
}
```

#### 1.3 Fix frontend PermissionContext wildcard handling
**File:** `frontend/src/context/PermissionContext.tsx`
```typescript
const hasPermission = (keys: string[]) => {
    if (state.fetchFailed) return false;
    if (state.mode === "open") return true;
    if (state.permissions.has("*")) return true; // SuperAdmin wildcard
    // ... existing logic
};
```

#### 1.4 Add `IsSystemAdmin` check in frontend AuthContext
Expose `isSuperAdmin` flag derived from either `IsSystemAdmin` claim or role name for use across the app.

---

### PHASE 2: ROLE-DIFFERENTIATED FRONTEND (3-5 days)

#### 2.1 Layout splitting by role
Create three shells:
- `SuperAdminShell` — system-wide nav (Tenants, System Settings, All Modules, System Audit, Schema Management)
- `AdminShell` — current protected layout (all ERP modules for tenant)
- `UserShell` — stripped-down layout showing only permitted modules/pages

#### 2.2 Role-specific Dashboards
- **SuperAdmin Dashboard**: System stats (total tenants, active users, system health, DB size, last audit entries)
- **Admin Dashboard**: Business KPIs (employees, payroll pending, leave requests, sales, purchases, attendance today)
- **Employee Dashboard**: My attendance, my leave balance, my payslip, my tasks, my appraisal
- **HR Manager Dashboard**: Team attendance, pending leave approvals, open positions, upcoming appraisals
- **Accountant Dashboard**: Pending payments, journal entries, receivables, payables

#### 2.3 Backend role-aware UI Shell
Update `/api/v1/ui-shell/navigation` to return role-filtered navigation:
- SuperAdmin → system menu
- Admin → all modules
- Others → only permitted modules

---

### PHASE 3: DYNAMIC SCHEMA SYSTEM (3-4 days)

#### 3.1 Database migration (add tables)
```sql
-- Run as migration
CREATE TABLE EntityFieldDefinitions ( ... );  -- see section 3.3
CREATE TABLE EntityFieldValues ( ... );
```

#### 3.2 Backend API
New controller: `EntityFieldsController`
- `GET /api/v1/entity-fields/{entityName}` — get field definitions for entity
- `POST /api/v1/entity-fields` — create new field (SuperAdmin/Admin only)
- `PUT /api/v1/entity-fields/{id}` — update field
- `DELETE /api/v1/entity-fields/{id}` — soft delete field (data preserved)
- `GET /api/v1/entity-fields/values/{entityId}` — get custom field values
- `POST /api/v1/entity-fields/values` — save custom field values

#### 3.3 Frontend Dynamic Form Component
`DynamicFieldsSection` component:
- Fetches field definitions for the current entity
- Renders appropriate input types (text, number, date, select, checkbox)
- Saves values to EntityFieldValues via API
- Integrated into all entity detail pages (Employee, Vendor, Customer, etc.)

#### 3.4 Schema Manager UI (SuperAdmin only)
Page at `/platform/schema-manager`:
- List all entities
- Add/Edit/Remove custom fields per entity
- Drag-to-reorder display order
- Mark fields as required/optional
- Define select options for dropdown fields

---

### PHASE 4: MODULE-BY-MODULE COMPLETE UI (10-15 days)

Each module must follow this standard structure:

#### Standard Module Pattern:
```
/app/(protected)/erp/{module}/
    page.tsx           → List page (DataTable + filters + search + pagination)
    new/page.tsx       → Create form
    [id]/page.tsx      → Detail/Edit form (with dynamic fields section)
    [id]/delete/       → (handled via modal in list page)
```

#### Standard List Page Requirements:
- DataTable with sortable columns
- Client-side + server-side search
- Filters panel (status, date range, category, etc.)
- Bulk select + bulk actions
- Export to CSV/Excel
- Pagination (server-side)
- Quick action buttons (Edit, View, Delete)

#### Standard Form Requirements:
- Validation (client-side + server-side errors shown)
- Auto-save draft (localStorage)
- Dynamic fields section at the bottom
- Breadcrumb navigation
- Cancel → back to list

#### Module Priority Order:
| Priority | Module | Features |
|----------|--------|---------|
| 1 | **Employees (HRMS)** | Full CRUD, photo upload, dynamic fields, org chart |
| 2 | **Attendance** | Daily grid, bulk punch, correction workflow |
| 3 | **Leave Management** | Request, approve/reject workflow, balance display |
| 4 | **Payroll** | Run payroll, payslip generation, PDF download |
| 5 | **Recruitment** | Job postings, applications pipeline, screening |
| 6 | **Vendors & Purchase Orders** | Full procurement cycle |
| 7 | **Customers & Sales Orders** | Full sales cycle |
| 8 | **Inventory (Items + Warehouse + Stock)** | Stock management |
| 9 | **Chart of Accounts + Journal Entries** | Accounting |
| 10 | **Reports** | Cross-module analytics |
| 11 | **Training & Appraisal** | L&D and Performance cycles |
| 12 | **Compliance (PF/ESI/IT)** | Statutory reports |

---

### PHASE 5: PERMISSION & ROLE MANAGEMENT UI (2-3 days)

#### 5.1 Roles Management Page
- List all roles
- Create/Edit/Delete roles
- Assign permissions to roles (checkbox tree by module → action)

#### 5.2 Permissions Tree
Full permission hierarchy:
```
erp.*
  erp.dashboard
  erp.charts_of_accounts.view | create | update | delete
  erp.journal_entries.view | create | update | delete
  ...

hrms.*
  hrms.employees.view | create | update | delete | export
  hrms.attendance.view | mark | correct | report
  hrms.leave.view | apply | approve | reject
  ...

payroll.*
  payroll.run | payroll.view | payroll.export
  ...

platform.*
  platform.users.view | create | update | delete
  platform.roles.view | create | update | delete
  platform.modules.enable | disable
  ...
```

#### 5.3 User-Role Assignment
- Users page → Role tab → assign/remove roles
- Visual indicator of effective permissions

---

### PHASE 6: WORKFLOW & APPROVALS ENGINE (3-4 days)

All these processes need multi-step approval workflows:
- Leave requests
- Purchase orders above threshold
- Payroll run approval
- Overtime requests
- Expense claims
- Asset requests

The workflow definitions already exist in the DB. Need:
- Workflow designer UI (or at minimum config-based)
- Approval inbox page (shows all pending actions for current user)
- Backend workflow engine to advance/reject steps

---

### PHASE 7: NOTIFICATIONS, AUDIT & SECURITY (2 days)

#### 7.1 Real-time Notifications
- Notification bell in topbar already exists
- Need: WebSocket / SignalR for real-time push OR polling
- Notification types: approval requests, payroll processed, attendance alerts

#### 7.2 Audit Log Viewer
- `/security/audit-logs` — filterable, searchable table
- Show who did what, when, on which entity
- SuperAdmin and Admin only

#### 7.3 Security Dashboard
- Failed login attempts
- Active sessions
- Token revocations
- IP access log

---

## 5. DATABASE MIGRATION STRATEGY (Zero-Downtime)

### For adding columns to existing tables in deployed system:
1. **Custom Fields System** (Phase 3) handles 90% of cases — no migration needed
2. For structural changes, use EF Core migrations with:
   - `AddColumnMigration` — adds nullable column, no data loss
   - `AlterColumnMigration` — never reduce size in production
3. Migration runner endpoint (SuperAdmin only):
   - `POST /api/v1/system/run-migrations` — triggers pending EF migrations
   - Protected by `IsSystemAdmin` check only
4. A `SystemController` endpoint already exists — extend it

### Safe migration rules:
- ✅ ADD nullable column — safe, zero downtime
- ✅ ADD new table — safe
- ✅ ADD index — can do online with `ONLINE = ON` in SQL Server
- ⚠️ RENAME column — requires two-phase migration (add new, migrate data, remove old)
- ❌ DROP column — never in production without data archival plan
- ❌ Reduce column size — never, risk data truncation

---

## 6. API DESIGN CONTRACT

### Standard API Response Format (all endpoints must follow):
```json
// Success (list)
{ "data": [...], "total": 100, "page": 1, "pageSize": 20 }

// Success (single)
{ "data": { ... } }

// Error
{ "message": "Human readable error", "code": "ERROR_CODE", "errors": { "field": ["msg"] } }
```

### Standard Query Parameters:
```
?page=1&pageSize=20&search=term&sortBy=createdAt&sortDir=desc&filter[status]=active
```

Currently most controllers return ad-hoc response shapes — standardize this in Phase 4.

---

## 7. CODE QUALITY STANDARDS

### Backend
- Every controller must have: `[Authorize]`, input validation, try-catch for external calls
- SuperAdmin bypass in every `[Authorize(Policy = "...")]` handler
- All DB queries use `.AsNoTracking()` for reads
- Use DTOs — never return entity objects directly
- Soft delete everywhere (`IsDeleted` flag, never hard delete)

### Frontend
- Every page wrapped in `<ProtectedRoute>` or permission check
- No hardcoded permission strings — use `PERMISSIONS` constants
- API calls only through `apiClient` (handles auth, CSRF, error formatting)
- Loading states + error states + empty states for every data list
- Consistent use of TailwindCSS design tokens

---

## 8. IMMEDIATE ACTION ITEMS (Next 48 hours)

| # | Action | File | Priority |
|---|--------|------|----------|
| 1 | Fix SuperAdmin bypass in ModuleEnabledHandler | `Authorization/ModuleEnabledHandler.cs` | 🔴 CRITICAL |
| 2 | Fix permissions endpoint — return `mode:"open"` for IsSystemAdmin | `Controllers/AuthController.cs` | 🔴 CRITICAL |
| 3 | Fix frontend wildcard `"*"` in PermissionContext | `context/PermissionContext.tsx` | 🔴 CRITICAL |
| 4 | Add `isSuperAdmin` to AuthContext and expose it | `context/AuthContext.tsx` | 🟠 HIGH |
| 5 | Split protected layout into SuperAdmin/Admin/User shells | `app/(protected)/layout.tsx` | 🟠 HIGH |
| 6 | Create EntityFieldDefinitions migration SQL | `migrations_scripts/` | 🟡 MEDIUM |
| 7 | Complete Employee module full CRUD UI | `app/(protected)/hrms/employees/` | 🟡 MEDIUM |
| 8 | Complete Attendance daily grid | `app/(protected)/hrms/attendance/` | 🟡 MEDIUM |

---

## 9. FOLDER STRUCTURE CONVENTIONS

```
frontend/src/
├── app/
│   ├── (auth)/           — login, forgot password
│   └── (protected)/
│       ├── layout.tsx    — role-aware shell selector
│       ├── dashboard/    — role-specific dashboard
│       ├── erp/          — ERP module pages
│       ├── hrms/         — HRMS module pages
│       ├── payroll/      — Payroll module pages
│       ├── platform/     — Admin: users, roles, schema manager
│       ├── security/     — Audit logs, security
│       └── licensing/    — Module licensing
├── components/
│   ├── layout/
│   │   ├── SuperAdminShell.tsx    ← NEW
│   │   ├── AdminShell.tsx         ← NEW
│   │   └── UserShell.tsx          ← NEW
│   ├── ui/               — shared UI primitives
│   ├── DynamicFieldsSection.tsx   ← NEW (Phase 3)
│   └── DataTable.tsx              ← NEW (Phase 4)
├── modules/
│   ├── hrms/
│   │   ├── sidebar.ts
│   │   ├── components/   ← module-specific components
│   │   └── hooks/        ← module-specific hooks
│   └── ...
├── hooks/                — shared React hooks
├── lib/                  — apiClient, utilities
├── context/              — Auth, Permission, Tenant, UiSchema
├── config/               — modules.config, route-permissions.config
└── constants/            — PERMISSIONS, ROUTES
```

---

## 10. HOW TO PROCEED (Recommended Order)

1. **Start here** → Apply Phase 1 fixes (SuperAdmin bypass) — test login as SuperAdmin
2. **Then** → Phase 2 layout split — verify SuperAdmin sees different navigation
3. **Then** → Phase 3 dynamic fields — verify schema manager works
4. **Then** → Module by module from Phase 4 priority list
5. **Parallel** → Phase 5 permission management UI (needed for other roles to work)
6. **Later** → Phase 6 workflow engine
7. **Last** → Phase 7 notifications and audit

> Say "start Phase 1" or "start Phase 2" or "build Employee module" to begin implementation of any specific phase/module.
