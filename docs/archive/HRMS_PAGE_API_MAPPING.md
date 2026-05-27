# HRMS Frontend — Page to API Mapping (Web)

> Golden rule: If a page does not have a backed API + module policy, it should not exist in the web UI.

## Authentication & Session
- Login
  - POST /api/v1/auth/login
  - GET /api/v1/auth/me (session check)
  - POST /api/v1/auth/logout
- Modules
  - GET /api/v1/modules/enabled (drives routing + menu)

## Core Pages (Module-driven)

### Dashboard (HRMS)
- GET /api/v1/hr/dashboard

### Employee Master (HRMS)
- GET /api/v1/employees

### Attendance (HRMS)
- GET /api/v1/attendance

### Leave Management (HRMS)
- GET /api/v1/leave/policies
- GET /api/v1/leave/requests

### Payroll (Payroll)
- GET /api/v1/payroll/runs
- GET /api/v1/payroll/payslips

### Reports (Reports)
- GET /api/v1/reports/attendance-summary

### Settings (Core)
- GET /api/v1/settings/feature-flags
- POST /api/v1/settings/feature-flags

## Page Inventory (Allowed)
- Login
- Dashboard (HR metrics only)
- Employee Master
- Attendance
- Leave Management
- Payroll (view)
- Reports
- Settings (limited)

## Page Inventory (Not Allowed)
- Team page (web)
- User/Role management (until Admin module exists)
- CRM/Inventory/Finance
- Dummy dashboards/charts
- Hardcoded permission logic
- UI-level attendance/salary calculations
