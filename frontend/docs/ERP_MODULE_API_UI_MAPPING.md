# ERP Module-wise API + UI Mapping

## Purpose
Create a single source of truth for:
- Route
- Permission
- API endpoint
- UI component/page contract

---

## 1) Dashboard Module

| Area | Route | Permission | API | UI Component |
|---|---|---|---|---|
| ERP Dashboard | `/erp/dashboard` | `dashboard.view` | `GET /reports/hr/project-compare` + summary APIs | `ERPDashboardPage` |
| Alerts | `/erp/dashboard` | `alerts.view` | `GET /notifications/me?unreadOnly=true` | `DashboardAlertsPanel` |

---

## 2) HRMS Module

| Feature | Route | Permission | API | UI |
|---|---|---|---|---|
| Employees | `/erp/hrms/employees` | `employee.view` | `GET /employees` | Employee table page |
| Attendance | `/erp/hrms/attendance` | `attendance.view` | `GET /attendance` | Attendance table |
| Leave | `/erp/hrms/leave` | `leave.view` | `GET /leave/requests` | Leave list + actions |
| Recruitment | `/erp/hrms/recruitment` | `recruitment.view` | `GET /recruitment/job-postings` | Recruitment pipeline |

---

## 3) Finance Module

| Feature | Route | Permission | API | UI |
|---|---|---|---|---|
| Payroll Dashboard | `/erp/payroll` | `payroll.view` | `GET /payroll/runs` | Payroll summary |
| Payroll Runs | `/erp/payroll/runs` | `payroll.run.view` | `GET /payroll/runs` | Runs table |
| Components | `/erp/payroll/components` | `payroll.component.view` | `GET /payroll/components` | Component grid/table |
| Payslips | `/erp/payroll/payslips` | `payslip.view` | `GET /payroll/payslips` | Payslip list |
| Statutory | `/erp/payroll/statutory` | `statutory.view` | `GET /payroll/statutory/*` | Statutory cards |

---

## 4) Operations Module

| Feature | Route | Permission | API | UI |
|---|---|---|---|---|
| Customers | `/erp/customers` | `customer.view` | `GET /customers` | Customers table |
| Vendors | `/erp/vendors` | `vendor.view` | `GET /vendors` | Vendors table |
| Items | `/erp/items` | `item.view` | `GET /items` | Inventory item table |
| Sales Orders | `/erp/sales-orders` | `salesorder.view` | `GET /salesorders` | Sales order list |
| Purchase Orders | `/erp/purchase-orders` | `purchaseorder.view` | `GET /purchaseorders` | Purchase order list |

---

## 5) Reports Module

| Feature | Route | Permission | API | UI |
|---|---|---|---|---|
| Reports Home | `/erp/reports` | `reports.view` | N/A (navigation) | Reports hub |
| HR Reports | `/erp/reports/hr` | `reports.hr.view` | `GET /reports/hr/*` | KPI/charts |
| Payroll Reports | `/erp/reports/payroll` | `reports.payroll.view` | `GET /reports/payroll/*` | Summary charts |
| Compliance Reports | `/erp/reports/compliance` | `reports.compliance.view` | `GET /reports/compliance/*` | Audit/compliance widgets |

---

## 6) Notifications + Documents + Audit

| Feature | Route | Permission | API | UI |
|---|---|---|---|---|
| Notifications | `/erp/notifications` | `notifications.view` | `GET /notifications/me` | Notification center |
| Mark Read | `/erp/notifications` | `notifications.update` | `POST /notifications/{id}/read` | Action button |
| Documents | `/erp/documents` | `documents.view` | `GET /documents` | Document library |
| Upload | `/erp/documents` | `documents.create` | `POST /documents/upload` | Upload form |
| Download | `/erp/documents` | `documents.download` | `GET /documents/{id}/download` | Download action |
| Audit Logs | `/platform/audit-logs` | `audit.view` | `GET /auditlogs` | Audit table + filters |

---

## 7) Global Search Mapping

| Search Type | Source API | Navigate To |
|---|---|---|
| Employee | `GET /search?q=` | `/erp/hrms/employees/:id` |
| Project | `GET /search?q=` | `/context` / project-scoped route |
| Invoice/Order | `GET /search?q=` | `/erp/sales-orders/:id` or `/erp/purchase-orders/:id` |

---

## 8) Constants to Add (Next Step)

### Routes
```ts
export const ROUTES = {
  DASHBOARD: "/erp/dashboard",
  HRMS_EMPLOYEES: "/erp/hrms/employees",
  PAYROLL: "/erp/payroll",
  CUSTOMERS: "/erp/customers",
  NOTIFICATIONS: "/erp/notifications",
  DOCUMENTS: "/erp/documents",
};
```

### Permissions
```ts
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  EMPLOYEE_VIEW: "employee.view",
  PAYROLL_VIEW: "payroll.view",
  CUSTOMER_VIEW: "customer.view",
  NOTIFICATIONS_VIEW: "notifications.view",
  DOCUMENTS_VIEW: "documents.view",
};
```

---

## 9) Governance Rule
- New page cannot be merged without:
  - route constant
  - permission constant
  - API mapping row in this document
