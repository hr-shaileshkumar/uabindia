# 03 — Frontend Page Master Inventory

## Executive Summary
A total of **192 pages** were discovered and analyzed in the Next.js App Router tree. Each page has been classified by architectural type, hardcoding intensity, metadata readiness, and migration risk.

## Page Distribution by Architectural Classification

| Classification Code | Architectural Type | Page Count | Description |
| :--- | :--- | :--- | :--- |
| **TYPE A** | Fully Static | 0 | Public marketing, legal, static content, documentation |
| **TYPE B** | Standard CRUD Page | 108 | Create, Read, Update, Delete with standard form/drawer |
| **TYPE C** | Form-Heavy Page | 22 | Multi-step wizards, onboarding questionnaires |
| **TYPE D** | Table / List Page | 9 | High-density data grid with filtering, sorting, export |
| **TYPE E** | Operational Dashboard | 3 | KPI scorecards, charts, aggregation widgets |
| **TYPE F** | Workflow & Approval Page | 2 | State transitions, approval steps, request history |
| **TYPE G** | Master-Data Reference Page | 4 | Departments, Designations, Branches, Currencies |
| **TYPE H** | Financial / Transaction Page | 20 | Payroll runs, Journal entries, Invoices, Payments |
| **TYPE I** | Report / Analytics Page | 7 | Parametric queries, statutory reports, cross-module |
| **TYPE J** | Configuration Page | 7 | Tenant settings, numbering series, schema builder |
| **TYPE K** | Security & Governance Page | 10 | Roles, Permissions, MFA, SSO, Audit logs |
| **TYPE L** | Specialized / Custom Page | 0 | EDI processing, interactive org chart, AI prompt playground |

## Complete Frontend Page Registry

| Route | Physical Source Path | Type | Priority | Risk | Hardcoding | Metadata Readiness |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `//forgot-password` | `frontend/src/app/(auth)/forgot-password/page.tsx` | TYPE C | P2 | Low | 45% | 50% |
| `//login` | `frontend/src/app/(auth)/login/page.tsx` | TYPE C | P2 | Low | 45% | 50% |
| `//otp-verification` | `frontend/src/app/(auth)/otp-verification/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//register` | `frontend/src/app/(auth)/register/page.tsx` | TYPE C | P2 | Low | 45% | 50% |
| `//reset-password` | `frontend/src/app/(auth)/reset-password/page.tsx` | TYPE C | P2 | Low | 45% | 50% |
| `//accounting-periods` | `frontend/src/app/(protected)/accounting-periods/page.tsx` | TYPE D | P2 | Low | 95% | 65% |
| `//administration/ai-assistant` | `frontend/src/app/(protected)/administration/ai-assistant/page.tsx` | TYPE C | P2 | Low | 95% | 35% |
| `//administration/audit-logs` | `frontend/src/app/(protected)/administration/audit-logs/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/backup` | `frontend/src/app/(protected)/administration/backup/page.tsx` | TYPE B | P2 | Low | 80% | 35% |
| `//administration/branches` | `frontend/src/app/(protected)/administration/branches/page.tsx` | TYPE G | P2 | Low | 30% | 50% |
| `//administration/business-units` | `frontend/src/app/(protected)/administration/business-units/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/companies` | `frontend/src/app/(protected)/administration/companies/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/contact-submissions` | `frontend/src/app/(protected)/administration/contact-submissions/page.tsx` | TYPE B | P2 | Low | 80% | 35% |
| `//administration/cost-centers` | `frontend/src/app/(protected)/administration/cost-centers/page.tsx` | TYPE G | P2 | Low | 30% | 50% |
| `//administration/data-management` | `frontend/src/app/(protected)/administration/data-management/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/departments` | `frontend/src/app/(protected)/administration/departments/page.tsx` | TYPE G | P2 | Low | 30% | 50% |
| `//administration/designations` | `frontend/src/app/(protected)/administration/designations/page.tsx` | TYPE G | P2 | Low | 30% | 50% |
| `//administration/developer-center` | `frontend/src/app/(protected)/administration/developer-center/page.tsx` | TYPE C | P2 | Low | 95% | 35% |
| `//administration/electronic-data-interchange` | `frontend/src/app/(protected)/administration/electronic-data-interchange/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//administration/entity-builder` | `frontend/src/app/(protected)/administration/entity-builder/page.tsx` | TYPE J | P0 | Low | 80% | 35% |
| `//administration/feature-flags` | `frontend/src/app/(protected)/administration/feature-flags/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//administration/geography-hierarchy` | `frontend/src/app/(protected)/administration/geography-hierarchy/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/holiday-calendar` | `frontend/src/app/(protected)/administration/holiday-calendar/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//administration/integrations/connectors` | `frontend/src/app/(protected)/administration/integrations/connectors/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/integrations` | `frontend/src/app/(protected)/administration/integrations/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/master-data` | `frontend/src/app/(protected)/administration/master-data/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/menu-builder` | `frontend/src/app/(protected)/administration/menu-builder/page.tsx` | TYPE J | P0 | Low | 65% | 35% |
| `//administration/migration-dashboard` | `frontend/src/app/(protected)/administration/migration-dashboard/page.tsx` | TYPE E | P1 | Medium | 80% | 35% |
| `//administration/module-mapping` | `frontend/src/app/(protected)/administration/module-mapping/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/notification-templates` | `frontend/src/app/(protected)/administration/notification-templates/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//administration/org-chart` | `frontend/src/app/(protected)/administration/org-chart/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/page-builder` | `frontend/src/app/(protected)/administration/page-builder/page.tsx` | TYPE J | P0 | Low | 95% | 35% |
| `//administration` | `frontend/src/app/(protected)/administration/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/permissions` | `frontend/src/app/(protected)/administration/permissions/page.tsx` | TYPE K | P0 | Low | 30% | 50% |
| `//administration/policies` | `frontend/src/app/(protected)/administration/policies/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/privacy` | `frontend/src/app/(protected)/administration/privacy/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//administration/projects` | `frontend/src/app/(protected)/administration/projects/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/recycle-bin` | `frontend/src/app/(protected)/administration/recycle-bin/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/roles` | `frontend/src/app/(protected)/administration/roles/page.tsx` | TYPE K | P0 | Low | 30% | 50% |
| `//administration/schema-manager` | `frontend/src/app/(protected)/administration/schema-manager/page.tsx` | TYPE J | P0 | Low | 80% | 35% |
| `//administration/security/sessions` | `frontend/src/app/(protected)/administration/security/sessions/page.tsx` | TYPE K | P0 | Low | 65% | 35% |
| `//administration/settings` | `frontend/src/app/(protected)/administration/settings/page.tsx` | TYPE J | P0 | Low | 30% | 50% |
| `//administration/support` | `frontend/src/app/(protected)/administration/support/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/system-health` | `frontend/src/app/(protected)/administration/system-health/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/tenants/create` | `frontend/src/app/(protected)/administration/tenants/create/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/tenants` | `frontend/src/app/(protected)/administration/tenants/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/tenants/[id]/edit` | `frontend/src/app/(protected)/administration/tenants/[id]/edit/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/tenants/[id]` | `frontend/src/app/(protected)/administration/tenants/[id]/page.tsx` | TYPE B | P2 | Low | 80% | 35% |
| `//administration/users` | `frontend/src/app/(protected)/administration/users/page.tsx` | TYPE K | P0 | Low | 30% | 50% |
| `//administration/webhooks` | `frontend/src/app/(protected)/administration/webhooks/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//administration/website/pages` | `frontend/src/app/(protected)/administration/website/pages/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//administration/website/settings` | `frontend/src/app/(protected)/administration/website/settings/page.tsx` | TYPE J | P0 | Low | 80% | 35% |
| `//administration/website/templates` | `frontend/src/app/(protected)/administration/website/templates/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/website/themes` | `frontend/src/app/(protected)/administration/website/themes/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//administration/workflow-config` | `frontend/src/app/(protected)/administration/workflow-config/page.tsx` | TYPE F | P2 | Low | 95% | 35% |
| `//ai` | `frontend/src/app/(protected)/ai/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//approvals` | `frontend/src/app/(protected)/approvals/page.tsx` | TYPE F | P2 | Low | 30% | 50% |
| `//assets/depreciation` | `frontend/src/app/(protected)/assets/depreciation/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//communication/announcements` | `frontend/src/app/(protected)/communication/announcements/page.tsx` | TYPE D | P2 | Low | 80% | 65% |
| `//communication/email-templates` | `frontend/src/app/(protected)/communication/email-templates/page.tsx` | TYPE C | P2 | Low | 95% | 35% |
| `//communication` | `frontend/src/app/(protected)/communication/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//communication/sms-templates` | `frontend/src/app/(protected)/communication/sms-templates/page.tsx` | TYPE C | P2 | Low | 95% | 35% |
| `//compliance` | `frontend/src/app/(protected)/compliance/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//context` | `frontend/src/app/(protected)/context/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//crm/contacts` | `frontend/src/app/(protected)/crm/contacts/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//crm/customers` | `frontend/src/app/(protected)/crm/customers/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//crm/leads` | `frontend/src/app/(protected)/crm/leads/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//crm` | `frontend/src/app/(protected)/crm/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//crm/pipeline` | `frontend/src/app/(protected)/crm/pipeline/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//dashboard` | `frontend/src/app/(protected)/dashboard/page.tsx` | TYPE E | P1 | Medium | 30% | 50% |
| `//documents` | `frontend/src/app/(protected)/documents/page.tsx` | TYPE D | P2 | Low | 80% | 65% |
| `//employee-self-service` | `frontend/src/app/(protected)/employee-self-service/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//expenses` | `frontend/src/app/(protected)/expenses/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//field-service` | `frontend/src/app/(protected)/field-service/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//finance/bank-reconciliation` | `frontend/src/app/(protected)/finance/bank-reconciliation/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//finance/budgeting` | `frontend/src/app/(protected)/finance/budgeting/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//finance/chart-of-accounts` | `frontend/src/app/(protected)/finance/chart-of-accounts/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//finance/consolidation` | `frontend/src/app/(protected)/finance/consolidation/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//finance/journal-entries` | `frontend/src/app/(protected)/finance/journal-entries/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//finance` | `frontend/src/app/(protected)/finance/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//fleet` | `frontend/src/app/(protected)/fleet/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//helpdesk/escalations` | `frontend/src/app/(protected)/helpdesk/escalations/page.tsx` | TYPE C | P2 | Low | 95% | 35% |
| `//helpdesk/faq` | `frontend/src/app/(protected)/helpdesk/faq/page.tsx` | TYPE C | P2 | Low | 95% | 35% |
| `//helpdesk` | `frontend/src/app/(protected)/helpdesk/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//helpdesk/tickets` | `frontend/src/app/(protected)/helpdesk/tickets/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/assessments` | `frontend/src/app/(protected)/hrms/assessments/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//hrms/assets` | `frontend/src/app/(protected)/hrms/assets/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/attendance` | `frontend/src/app/(protected)/hrms/attendance/page.tsx` | TYPE B | P2 | Low | 45% | 50% |
| `//hrms/certificates` | `frontend/src/app/(protected)/hrms/certificates/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//hrms/employees/new` | `frontend/src/app/(protected)/hrms/employees/new/page.tsx` | TYPE B | P1 | Low | 30% | 50% |
| `//hrms/employees` | `frontend/src/app/(protected)/hrms/employees/page.tsx` | TYPE B | P1 | Low | 30% | 50% |
| `//hrms/employees/[id]` | `frontend/src/app/(protected)/hrms/employees/[id]/page.tsx` | TYPE B | P1 | Low | 30% | 50% |
| `//hrms/leave` | `frontend/src/app/(protected)/hrms/leave/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/lifecycle` | `frontend/src/app/(protected)/hrms/lifecycle/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/offboarding` | `frontend/src/app/(protected)/hrms/offboarding/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/onboarding` | `frontend/src/app/(protected)/hrms/onboarding/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/org-chart` | `frontend/src/app/(protected)/hrms/org-chart/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/overtime` | `frontend/src/app/(protected)/hrms/overtime/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms` | `frontend/src/app/(protected)/hrms/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//hrms/performance` | `frontend/src/app/(protected)/hrms/performance/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/probation` | `frontend/src/app/(protected)/hrms/probation/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/recruitment` | `frontend/src/app/(protected)/hrms/recruitment/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/screening-results` | `frontend/src/app/(protected)/hrms/screening-results/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//hrms/screening-schedule` | `frontend/src/app/(protected)/hrms/screening-schedule/page.tsx` | TYPE C | P2 | Low | 80% | 35% |
| `//hrms/shifts` | `frontend/src/app/(protected)/hrms/shifts/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//hrms/training` | `frontend/src/app/(protected)/hrms/training/page.tsx` | TYPE D | P2 | Low | 95% | 65% |
| `//hrms/travel` | `frontend/src/app/(protected)/hrms/travel/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//integrations/api-keys` | `frontend/src/app/(protected)/integrations/api-keys/page.tsx` | TYPE D | P2 | Low | 95% | 65% |
| `//integrations/apps` | `frontend/src/app/(protected)/integrations/apps/page.tsx` | TYPE D | P2 | Low | 65% | 65% |
| `//integrations/logs` | `frontend/src/app/(protected)/integrations/logs/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//integrations` | `frontend/src/app/(protected)/integrations/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//integrations/webhooks` | `frontend/src/app/(protected)/integrations/webhooks/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//inventory/items` | `frontend/src/app/(protected)/inventory/items/page.tsx` | TYPE B | P1 | Low | 30% | 50% |
| `//inventory` | `frontend/src/app/(protected)/inventory/page.tsx` | TYPE B | P1 | Low | 65% | 35% |
| `//inventory/warehouse-management` | `frontend/src/app/(protected)/inventory/warehouse-management/page.tsx` | TYPE B | P1 | Low | 30% | 50% |
| `//inventory/warehouses` | `frontend/src/app/(protected)/inventory/warehouses/page.tsx` | TYPE B | P1 | Low | 30% | 50% |
| `//inventory-adjustments` | `frontend/src/app/(protected)/inventory-adjustments/page.tsx` | TYPE B | P1 | Low | 30% | 50% |
| `//inventory-transfers` | `frontend/src/app/(protected)/inventory-transfers/page.tsx` | TYPE H | P1 | High | 30% | 50% |
| `//invoices` | `frontend/src/app/(protected)/invoices/page.tsx` | TYPE H | P1 | High | 30% | 50% |
| `//licensing/billing-history` | `frontend/src/app/(protected)/licensing/billing-history/page.tsx` | TYPE C | P2 | Low | 95% | 35% |
| `//licensing/catalog` | `frontend/src/app/(protected)/licensing/catalog/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//licensing/integrations` | `frontend/src/app/(protected)/licensing/integrations/page.tsx` | TYPE B | P2 | Low | 80% | 35% |
| `//licensing` | `frontend/src/app/(protected)/licensing/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//licensing/subscriptions` | `frontend/src/app/(protected)/licensing/subscriptions/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//licensing/usage` | `frontend/src/app/(protected)/licensing/usage/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//manager-self-service` | `frontend/src/app/(protected)/manager-self-service/page.tsx` | TYPE B | P2 | Low | 80% | 35% |
| `//manufacturing` | `frontend/src/app/(protected)/manufacturing/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//manufacturing/work-orders` | `frontend/src/app/(protected)/manufacturing/work-orders/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//notifications` | `frontend/src/app/(protected)/notifications/page.tsx` | TYPE D | P2 | Low | 80% | 65% |
| `//payments` | `frontend/src/app/(protected)/payments/page.tsx` | TYPE H | P2 | High | 80% | 65% |
| `//payroll/arrears` | `frontend/src/app/(protected)/payroll/arrears/page.tsx` | TYPE H | P2 | High | 95% | 35% |
| `//payroll/bonus` | `frontend/src/app/(protected)/payroll/bonus/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//payroll/components` | `frontend/src/app/(protected)/payroll/components/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//payroll/final-settlement` | `frontend/src/app/(protected)/payroll/final-settlement/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//payroll/loans` | `frontend/src/app/(protected)/payroll/loans/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//payroll` | `frontend/src/app/(protected)/payroll/page.tsx` | TYPE H | P2 | High | 65% | 35% |
| `//payroll/payslips` | `frontend/src/app/(protected)/payroll/payslips/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//payroll/reimbursements` | `frontend/src/app/(protected)/payroll/reimbursements/page.tsx` | TYPE H | P2 | High | 95% | 35% |
| `//payroll/runs` | `frontend/src/app/(protected)/payroll/runs/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//payroll/statutory` | `frontend/src/app/(protected)/payroll/statutory/page.tsx` | TYPE H | P2 | High | 95% | 35% |
| `//payroll/structures` | `frontend/src/app/(protected)/payroll/structures/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//payroll/tax-declarations` | `frontend/src/app/(protected)/payroll/tax-declarations/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//portal` | `frontend/src/app/(protected)/portal/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//procurement/goods-receipt-notes` | `frontend/src/app/(protected)/procurement/goods-receipt-notes/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//procurement` | `frontend/src/app/(protected)/procurement/page.tsx` | TYPE B | P2 | Low | 80% | 35% |
| `//procurement/purchase-orders` | `frontend/src/app/(protected)/procurement/purchase-orders/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//procurement/purchase-requests` | `frontend/src/app/(protected)/procurement/purchase-requests/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//procurement/vendors` | `frontend/src/app/(protected)/procurement/vendors/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//profile` | `frontend/src/app/(protected)/profile/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//projects` | `frontend/src/app/(protected)/projects/page.tsx` | TYPE B | P2 | Low | 65% | 35% |
| `//projects/tasks` | `frontend/src/app/(protected)/projects/tasks/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//projects/timesheets` | `frontend/src/app/(protected)/projects/timesheets/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//reports/builder` | `frontend/src/app/(protected)/reports/builder/page.tsx` | TYPE J | P0 | Low | 30% | 50% |
| `//reports/compliance` | `frontend/src/app/(protected)/reports/compliance/page.tsx` | TYPE I | P2 | Low | 65% | 65% |
| `//reports/custom` | `frontend/src/app/(protected)/reports/custom/page.tsx` | TYPE I | P2 | Low | 30% | 50% |
| `//reports/financial` | `frontend/src/app/(protected)/reports/financial/page.tsx` | TYPE I | P2 | Low | 80% | 65% |
| `//reports/hr` | `frontend/src/app/(protected)/reports/hr/page.tsx` | TYPE I | P2 | Low | 65% | 65% |
| `//reports/operations` | `frontend/src/app/(protected)/reports/operations/page.tsx` | TYPE I | P2 | Low | 65% | 65% |
| `//reports` | `frontend/src/app/(protected)/reports/page.tsx` | TYPE I | P2 | Low | 65% | 35% |
| `//reports/payroll` | `frontend/src/app/(protected)/reports/payroll/page.tsx` | TYPE I | P2 | Low | 80% | 65% |
| `//sales/discounts` | `frontend/src/app/(protected)/sales/discounts/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//sales/orders` | `frontend/src/app/(protected)/sales/orders/page.tsx` | TYPE H | P2 | High | 30% | 50% |
| `//sales` | `frontend/src/app/(protected)/sales/page.tsx` | TYPE B | P2 | Low | 80% | 35% |
| `//sales/pricing` | `frontend/src/app/(protected)/sales/pricing/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//sales/quotations` | `frontend/src/app/(protected)/sales/quotations/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//sales/returns` | `frontend/src/app/(protected)/sales/returns/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//security/access-logs` | `frontend/src/app/(protected)/security/access-logs/page.tsx` | TYPE K | P0 | Low | 65% | 65% |
| `//security/ip-restrictions` | `frontend/src/app/(protected)/security/ip-restrictions/page.tsx` | TYPE K | P0 | Low | 80% | 35% |
| `//security/multi-factor-authentication` | `frontend/src/app/(protected)/security/multi-factor-authentication/page.tsx` | TYPE K | P0 | Low | 95% | 65% |
| `//security` | `frontend/src/app/(protected)/security/page.tsx` | TYPE K | P0 | Low | 30% | 50% |
| `//security/password-policies` | `frontend/src/app/(protected)/security/password-policies/page.tsx` | TYPE K | P0 | Low | 80% | 35% |
| `//security/single-sign-on` | `frontend/src/app/(protected)/security/single-sign-on/page.tsx` | TYPE K | P0 | Low | 95% | 35% |
| `//stock-movements` | `frontend/src/app/(protected)/stock-movements/page.tsx` | TYPE D | P2 | Low | 80% | 65% |
| `//superadmin/dashboard` | `frontend/src/app/(protected)/superadmin/dashboard/page.tsx` | TYPE E | P1 | Medium | 30% | 50% |
| `//tax-management` | `frontend/src/app/(protected)/tax-management/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//vendor-bills` | `frontend/src/app/(protected)/vendor-bills/page.tsx` | TYPE D | P2 | Low | 95% | 65% |
| `//about` | `frontend/src/app/about/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//book-demo` | `frontend/src/app/book-demo/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//careers` | `frontend/src/app/careers/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//contact` | `frontend/src/app/contact/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//help-support` | `frontend/src/app/help-support/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//industries` | `frontend/src/app/industries/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//industries/[slug]` | `frontend/src/app/industries/[slug]/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//not-authorized` | `frontend/src/app/not-authorized/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//` | `frontend/src/app/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//pricing` | `frontend/src/app/pricing/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//privacy` | `frontend/src/app/privacy/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//products` | `frontend/src/app/products/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//products/[slug]` | `frontend/src/app/products/[slug]/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//resources` | `frontend/src/app/resources/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//tenant-not-found` | `frontend/src/app/tenant-not-found/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
| `//terms` | `frontend/src/app/terms/page.tsx` | TYPE B | P2 | Low | 30% | 50% |
