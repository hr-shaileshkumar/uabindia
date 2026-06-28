# Frontend Page Map

Last updated: 2026-06-08

## UI ownership model

### Software / Platform Owner
- Role: `super_admin`
- Purpose: ERP product owner UI for the person/company that owns this software project
- Can see: customer companies, subscriptions, platform users, tenant users, support tickets, module control, release/system health, global audit, usage reports
- Sensitive company payroll/documents should still require support access approval

### Business Owner / Company Superadmin
- Role: `tenant_owner`
- Purpose: client business owner UI for one company/tenant
- Can see: own company users, employees, modules, HRMS, payroll, finance, procurement, inventory, CRM, projects, approvals, reports, roles, website pages, and company settings
- Cannot see: other tenants, platform billing controls, release/system infrastructure

### Company Admin / HR / Manager / Employee
- Roles: `company_admin`, `hr`, `manager`, `employee`
- Purpose: scoped tenant operations and employee self-service

## Public layers

### Platform / Super Admin public site
- `/`
- `/features`
- `/industries`
- `/pricing`
- `/contact`
- `/login`

Purpose:
- Product marketing
- Pricing and sales motion
- Demo booking
- Software-owner positioning

### Tenant / Company public site
- `/`
- `/about`
- `/careers`
- `/contact`
- `/help-support`
- `/login`
- `/forgot-password`
- `/otp-verification`

Purpose:
- Employee self-service entry
- Help, support, and communication
- Limited company-facing public surface

Rules:
- No finance, payroll processing, admin settings, or cross-employee data on public tenant pages
- Public tenant pages should remain narrow and operational

## Protected layers

### Software Owner Console
- `/superadmin/dashboard`
- `/platform/*`
- `/erp/licensing/*`
- `/erp/helpdesk/*`
- `/erp/reports/*`
- `/erp/hrms/employees`

Audience:
- Software owner / SaaS operator / project owner

Capabilities:
- Customer companies
- Platform users
- Tenant users and employees support visibility
- Subscriptions and billing plans
- Module control
- System monitoring
- Global audit
- Release and support access control

### Business Owner / Company Superadmin
- `/erp/*`
- `/platform/users`
- `/platform/roles`
- `/platform/permissions`
- `/platform/settings`
- `/platform/website/*`
- `/platform/workflow-config`
- `/platform/notification-templates`

Audience:
- Client company owner / tenant superadmin

Capabilities:
- Own company users
- Own employees
- Own tenant modules
- Public website pages
- Role and permission assignment
- Company settings and workflows

### Business / Company workspace
- `/erp/dashboard`
- `/erp/hrms/*`
- `/erp/payroll/*`
- `/erp/reports/*`
- `/erp/chart-of-accounts`
- `/erp/vendors`
- `/erp/items`
- `/erp/customers`
- `/erp/security`
- `/platform/projects`

Audience:
- Company admin
- HR
- Manager

### Employee self-service workspace
- `/erp/dashboard`
- `/erp/hrms/attendance`
- `/erp/hrms/leave`
- `/erp/hrms/shifts`
- `/erp/payroll/payslips`
- `/erp/documents`
- `/erp/helpdesk`
- `/erp/communication/announcements`

Audience:
- Employee

## Route notes

- Canonical protected URLs use `/erp/*`, `/platform/*`, and `/superadmin/*`
- Legacy root-level protected routes are rewritten or canonicalized back to the `/erp/*` namespace
- Role guards should always evaluate canonical paths, not raw rewritten internals
- Tenant public pages are defined in `src/lib/erp/public-pages.ts` and should be used for public page permission assignment
