# Sidebar Navigation Audit Report

Last updated: 2026-04-09
Scope: `frontend` (App Router protected area)

## Objective
This report provides a verified mapping for:
- **module → submodule → route → page file**
- a **missing-routes checklist** for future additions

Primary source files audited:
- `src/app/(protected)/module-navigation.ts`
- `src/constants/routes.ts`
- `src/app/(protected)/**/page.tsx`
- `src/components/Sidebar.tsx`
- `src/config/route-permissions.config.ts`

---

## 1) Operations module (`erp`)

| Module | Submodule | Route | Page file |
|---|---|---|---|
| Operations | Dashboard | `/erp/dashboard` | `src/app/(protected)/dashboard/page.tsx` |
| Operations | Notifications | `/erp/notifications` | `src/app/(protected)/notifications/page.tsx` |
| Operations | Documents | `/erp/documents` | `src/app/(protected)/documents/page.tsx` |
| Operations | Chart of Accounts | `/erp/chart-of-accounts` | `src/app/(protected)/chart-of-accounts/page.tsx` |
| Operations | Journal Entries | `/erp/journal-entries` | `src/app/(protected)/journal-entries/page.tsx` |
| Operations | Payments | `/erp/payments` | `src/app/(protected)/payments/page.tsx` |
| Operations | Approvals | `/erp/approvals` | `src/app/(protected)/approvals/page.tsx` |
| Operations | Customers | `/erp/customers` | `src/app/(protected)/customers/page.tsx` |
| Operations | Sales Orders | `/erp/sales-orders` | `src/app/(protected)/sales-orders/page.tsx` |
| Operations | Vendors | `/erp/vendors` | `src/app/(protected)/vendors/page.tsx` |
| Operations | Purchase Orders | `/erp/purchase-orders` | `src/app/(protected)/purchase-orders/page.tsx` |
| Operations | Items | `/erp/items` | `src/app/(protected)/items/page.tsx` |
| Operations | Warehouses | `/erp/warehouses` | `src/app/(protected)/warehouses/page.tsx` |
| Operations | Stock Movements | `/erp/stock-movements` | `src/app/(protected)/stock-movements/page.tsx` |

---

## 2) HRMS module (`hrms`)

| Module | Submodule | Route | Page file |
|---|---|---|---|
| HRMS | HR Dashboard | `/erp/hrms` | `src/app/(protected)/hrms/page.tsx` |
| HRMS | Recruitment | `/erp/hrms/recruitment` | `src/app/(protected)/hrms/recruitment/page.tsx` |
| HRMS | Screening Schedule | `/erp/hrms/screening-schedule` | `src/app/(protected)/hrms/screening-schedule/page.tsx` |
| HRMS | Screening Results | `/erp/hrms/screening-results` | `src/app/(protected)/hrms/screening-results/page.tsx` |
| HRMS | Training | `/erp/hrms/training` | `src/app/(protected)/hrms/training/page.tsx` |
| HRMS | Assessments | `/erp/hrms/assessments` | `src/app/(protected)/hrms/assessments/page.tsx` |
| HRMS | Certificates | `/erp/hrms/certificates` | `src/app/(protected)/hrms/certificates/page.tsx` |
| HRMS | Employees | `/erp/hrms/employees` | `src/app/(protected)/hrms/employees/page.tsx` |
| HRMS | Performance | `/erp/hrms/performance` | `src/app/(protected)/hrms/performance/page.tsx` |
| HRMS | Attendance | `/erp/hrms/attendance` | `src/app/(protected)/hrms/attendance/page.tsx` |
| HRMS | Shifts | `/erp/hrms/shifts` | `src/app/(protected)/hrms/shifts/page.tsx` |
| HRMS | Leave | `/erp/hrms/leave` | `src/app/(protected)/hrms/leave/page.tsx` |
| HRMS | Overtime | `/erp/hrms/overtime` | `src/app/(protected)/hrms/overtime/page.tsx` |
| HRMS | Assets | `/erp/hrms/assets` | `src/app/(protected)/hrms/assets/page.tsx` |
| HRMS | HR Payroll | `/erp/hrms/payroll` | `src/app/(protected)/hrms/payroll/page.tsx` |

---

## 3) Finance module (`payroll`)

| Module | Submodule | Route | Page file |
|---|---|---|---|
| Finance | Payroll Dashboard | `/erp/payroll` | `src/app/(protected)/payroll/page.tsx` |
| Finance | Payroll Runs | `/erp/payroll/runs` | `src/app/(protected)/payroll/runs/page.tsx` |
| Finance | Structures | `/erp/payroll/structures` | `src/app/(protected)/payroll/structures/page.tsx` |
| Finance | Components | `/erp/payroll/components` | `src/app/(protected)/payroll/components/page.tsx` |
| Finance | Payslips | `/erp/payroll/payslips` | `src/app/(protected)/payroll/payslips/page.tsx` |
| Finance | Statutory | `/erp/payroll/statutory` | `src/app/(protected)/payroll/statutory/page.tsx` |

---

## 4) Reports module (`reports`)

| Module | Submodule | Route | Page file |
|---|---|---|---|
| Reports | Reports Home | `/erp/reports` | `src/app/(protected)/reports/page.tsx` |
| Reports | HR Reports | `/erp/reports/hr` | `src/app/(protected)/reports/hr/page.tsx` |
| Reports | Payroll Reports | `/erp/reports/payroll` | `src/app/(protected)/reports/payroll/page.tsx` |
| Reports | Compliance Reports | `/erp/reports/compliance` | `src/app/(protected)/reports/compliance/page.tsx` |

---

## 5) Admin module (`platform`)

| Module | Submodule | Route | Page file |
|---|---|---|---|
| Admin | Admin Overview | `/platform` | `src/app/(protected)/platform/page.tsx` |
| Admin | Companies | `/platform/companies` | `src/app/(protected)/platform/companies/page.tsx` |
| Admin | Tenants | `/platform/tenants` | `src/app/(protected)/platform/tenants/page.tsx` |
| Admin | Projects | `/platform/projects` | `src/app/(protected)/platform/projects/page.tsx` |
| Admin | Users | `/platform/users` | `src/app/(protected)/platform/users/page.tsx` |
| Admin | Roles | `/platform/roles` | `src/app/(protected)/platform/roles/page.tsx` |
| Admin | Settings | `/platform/settings` | `src/app/(protected)/platform/settings/page.tsx` |
| Admin | Feature Flags | `/platform/feature-flags` | `src/app/(protected)/platform/feature-flags/page.tsx` |
| Admin | Contact Submissions | `/platform/contact-submissions` | `src/app/(protected)/platform/contact-submissions/page.tsx` |
| Admin | Audit Logs | `/platform/audit-logs` | `src/app/(protected)/platform/audit-logs/page.tsx` |

---

## 6) Licensing module (`licensing`)

| Module | Submodule | Route | Page file |
|---|---|---|---|
| Licensing | Overview | `/erp/licensing` | `src/app/(protected)/licensing/page.tsx` |
| Licensing | Module Catalog | `/erp/licensing/catalog` | `src/app/(protected)/licensing/catalog/page.tsx` |
| Licensing | Subscriptions | `/erp/licensing/subscriptions` | `src/app/(protected)/licensing/subscriptions/page.tsx` |
| Licensing | Integrations | `/erp/licensing/integrations` | `src/app/(protected)/licensing/integrations/page.tsx` |

---

## 7) Security module (`security`)

| Module | Submodule | Route | Page file |
|---|---|---|---|
| Security | Security Overview | `/erp/security` | `src/app/(protected)/security/page.tsx` |
| Security | Sessions | `/erp/security/sessions` | `src/app/(protected)/security/sessions/page.tsx` |
| Security | MFA | `/erp/security/mfa` | `src/app/(protected)/security/mfa/page.tsx` |
| Security | Devices | `/erp/security/devices` | `src/app/(protected)/security/devices/page.tsx` |
| Security | Password Policies | `/erp/security/password-policies` | `src/app/(protected)/security/password-policies/page.tsx` |

---

## 8) Pages intentionally not in sidebar

These exist under protected routes but are intentionally not direct sidebar items:
- `src/app/(protected)/context/page.tsx` (`/context`) — context selection flow
- `src/app/(protected)/page.tsx` (`/`) — dashboard alias/root composition page
- `src/app/(protected)/dashboard/page.tsx` (`/dashboard` route file) — canonical dashboard entry under redirects

---

## 9) Missing-routes checklist for future additions

When adding a new page/module/submodule, complete this checklist **before merge**:

### Route and constants
- [ ] Add route in `src/constants/routes.ts`
- [ ] Use `ROUTES.*` constant in sidebar config and page links (no hardcoded paths)

### Sidebar and module registration
- [ ] Add submodule entry in `src/app/(protected)/module-navigation.ts`
- [ ] Ensure the relevant module map/grouping is present and ordered correctly
- [ ] Validate group label and icon naming consistency

### Page and module structure
- [ ] Create page file under `src/app/(protected)/.../page.tsx`
- [ ] Keep page thin: `ProtectedRoute` + module component pattern
- [ ] Put business UI/logic in `src/features/<domain>/components/*`

### Permissions and access
- [ ] Add permission constant in `src/constants/permissions.ts` (if required)
- [ ] Wire `ProtectedRoute permission={...}` on page
- [ ] Confirm role + permission model resolves correctly for admin and non-admin users

### Quality and UX validation
- [ ] Verify route appears in sidebar and opens correct page
- [ ] Verify active state and breadcrumbs are correct
- [ ] Run `npm run lint`
- [ ] Run `npx tsc -p tsconfig.json --noEmit`

---

## 10) Governance rule

A navigation-related PR is incomplete unless it includes all of:
1. `ROUTES` constant update
2. Sidebar map update
3. Module registration update (if new module)
4. Protected page + permission guard
5. Lint + typecheck green
