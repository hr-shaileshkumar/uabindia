"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { platformApi } from "@/services/modules/administration";
import { cn } from "@/lib/utils";
import type { UiPageSummary } from "@/lib/dynamic-schema/types";

interface PageInventoryItem {
  key: string;
  name: string;
  module: string;
  route: string;
  isDynamic: boolean;
  version?: number;
  status: "Published" | "Draft" | "Legacy";
  hardcodedFieldsEstimate: number;
}

const ERP_PAGE_INVENTORY: PageInventoryItem[] = [
  { key: "finance.accounting-periods", name: "Accounting periods", module: "Finance", route: "/accounting-periods", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.ai-assistant", name: "Ai assistant", module: "Administration", route: "/administration/ai-assistant", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.audit-logs", name: "Audit logs", module: "Administration", route: "/administration/audit-logs", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.backup", name: "Backup", module: "Administration", route: "/administration/backup", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.branches", name: "Branches", module: "Administration", route: "/administration/branches", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.business-units", name: "Business units", module: "Administration", route: "/administration/business-units", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.companies", name: "Companies", module: "Administration", route: "/administration/companies", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.contact-submissions", name: "Contact submissions", module: "Administration", route: "/administration/contact-submissions", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.cost-centers", name: "Cost centers", module: "Administration", route: "/administration/cost-centers", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.data-management", name: "Data management", module: "Administration", route: "/administration/data-management", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.departments", name: "Departments", module: "Administration", route: "/administration/departments", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.designations", name: "Designations", module: "Administration", route: "/administration/designations", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.developer-center", name: "Developer center", module: "Administration", route: "/administration/developer-center", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.electronic-data-interchange", name: "Electronic data interchange", module: "Administration", route: "/administration/electronic-data-interchange", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.entity-builder", name: "Entity builder", module: "Administration", route: "/administration/entity-builder", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.feature-flags", name: "Feature flags", module: "Administration", route: "/administration/feature-flags", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.geography-hierarchy", name: "Geography hierarchy", module: "Administration", route: "/administration/geography-hierarchy", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.holiday-calendar", name: "Holiday calendar", module: "Administration", route: "/administration/holiday-calendar", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.connectors", name: "Connectors", module: "Administration", route: "/administration/integrations/connectors", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.integrations", name: "Integrations", module: "Administration", route: "/administration/integrations", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.master-data", name: "Master data", module: "Administration", route: "/administration/master-data", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.menu-builder", name: "Menu builder", module: "Administration", route: "/administration/menu-builder", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.migration-dashboard", name: "Migration dashboard", module: "Administration", route: "/administration/migration-dashboard", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.module-mapping", name: "Module mapping", module: "Administration", route: "/administration/module-mapping", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.notification-templates", name: "Notification templates", module: "Administration", route: "/administration/notification-templates", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.org-chart", name: "Org chart", module: "Administration", route: "/administration/org-chart", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.page-builder", name: "Page builder", module: "Administration", route: "/administration/page-builder", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.permissions", name: "Permissions", module: "Administration", route: "/administration/permissions", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.policies", name: "Policies", module: "Administration", route: "/administration/policies", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.privacy", name: "Privacy", module: "Administration", route: "/administration/privacy", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.projects", name: "Projects", module: "Projects", route: "/administration/projects", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.recycle-bin", name: "Recycle bin", module: "Administration", route: "/administration/recycle-bin", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.roles", name: "Roles", module: "Administration", route: "/administration/roles", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.schema-manager", name: "Schema manager", module: "Administration", route: "/administration/schema-manager", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.security-sessions", name: "Sessions", module: "Security", route: "/administration/security/sessions", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.settings", name: "Settings", module: "Administration", route: "/administration/settings", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.support", name: "Support", module: "Administration", route: "/administration/support", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.system-health", name: "System health", module: "Administration", route: "/administration/system-health", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.tenants", name: "Tenants", module: "Administration", route: "/administration/tenants", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.users", name: "Users", module: "Administration", route: "/administration/users", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.webhooks", name: "Webhooks", module: "Administration", route: "/administration/webhooks", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.website.pages", name: "Pages", module: "Administration", route: "/administration/website/pages", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.website.settings", name: "Settings", module: "Administration", route: "/administration/website/settings", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.website.templates", name: "Templates", module: "Administration", route: "/administration/website/templates", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.website.themes", name: "Themes", module: "Administration", route: "/administration/website/themes", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.workflow-config", name: "Workflow config", module: "Workflow", route: "/administration/workflow-config", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "workflow.approvals", name: "Approvals", module: "Workflow", route: "/approvals", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "assets.depreciation", name: "Depreciation", module: "Assets", route: "/assets/depreciation", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "communication.announcements", name: "Announcements", module: "Communication", route: "/communication/announcements", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "communication.email-templates", name: "Email templates", module: "Communication", route: "/communication/email-templates", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "communication.sms-templates", name: "Sms templates", module: "Communication", route: "/communication/sms-templates", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "compliance.statutory", name: "Compliance", module: "Compliance", route: "/compliance", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "crm.contacts", name: "Contacts", module: "CRM", route: "/crm/contacts", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "crm.customers", name: "Customers", module: "CRM", route: "/crm/customers", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "crm.leads", name: "Leads", module: "CRM", route: "/crm/leads", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "crm.pipeline", name: "Pipeline", module: "CRM", route: "/crm/pipeline", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "documents.vault", name: "Documents", module: "Documents", route: "/documents", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.employee-self-service", name: "Employee self service", module: "Administration", route: "/employee-self-service", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.expenses", name: "Expenses", module: "Finance", route: "/expenses", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "projects.field-service", name: "Field service", module: "Projects", route: "/field-service", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.bank-reconciliation", name: "Bank reconciliation", module: "Finance", route: "/finance/bank-reconciliation", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.budgeting", name: "Budgeting", module: "Finance", route: "/finance/budgeting", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.chart-of-accounts", name: "Chart of accounts", module: "Finance", route: "/finance/chart-of-accounts", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.consolidation", name: "Consolidation", module: "Finance", route: "/finance/consolidation", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.journal-entries", name: "Journal entries", module: "Finance", route: "/finance/journal-entries", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "assets.fleet", name: "Fleet", module: "Assets", route: "/fleet", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "helpdesk.escalations", name: "Escalations", module: "Helpdesk", route: "/helpdesk/escalations", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "helpdesk.faq", name: "Faq", module: "Helpdesk", route: "/helpdesk/faq", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "helpdesk.tickets", name: "Tickets", module: "Helpdesk", route: "/helpdesk/tickets", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.assessments", name: "Assessments", module: "HRMS", route: "/hrms/assessments", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.assets", name: "Assets", module: "HRMS", route: "/hrms/assets", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.attendance", name: "Attendance", module: "HRMS", route: "/hrms/attendance", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.certificates", name: "Certificates", module: "HRMS", route: "/hrms/certificates", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.employees.new", name: "New", module: "HRMS", route: "/hrms/employees/new", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.employees", name: "Employees", module: "HRMS", route: "/hrms/employees", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.leave", name: "Leave", module: "HRMS", route: "/hrms/leave", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.lifecycle", name: "Lifecycle", module: "HRMS", route: "/hrms/lifecycle", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.offboarding", name: "Offboarding", module: "HRMS", route: "/hrms/offboarding", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.onboarding", name: "Onboarding", module: "HRMS", route: "/hrms/onboarding", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.org-chart", name: "Org chart", module: "HRMS", route: "/hrms/org-chart", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.overtime", name: "Overtime", module: "HRMS", route: "/hrms/overtime", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.performance", name: "Performance", module: "HRMS", route: "/hrms/performance", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.probation", name: "Probation", module: "HRMS", route: "/hrms/probation", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.recruitment", name: "Recruitment", module: "HRMS", route: "/hrms/recruitment", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.screening-results", name: "Screening results", module: "HRMS", route: "/hrms/screening-results", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.screening-schedule", name: "Screening schedule", module: "HRMS", route: "/hrms/screening-schedule", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.shifts", name: "Shifts", module: "HRMS", route: "/hrms/shifts", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.training", name: "Training", module: "HRMS", route: "/hrms/training", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "hrms.travel", name: "Travel", module: "HRMS", route: "/hrms/travel", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "integrations.api-keys", name: "Api keys", module: "Administration", route: "/integrations/api-keys", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "integrations.apps", name: "Apps", module: "Administration", route: "/integrations/apps", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "integrations.logs", name: "Logs", module: "Administration", route: "/integrations/logs", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "integrations.webhooks", name: "Webhooks", module: "Administration", route: "/integrations/webhooks", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "inventory.items", name: "Items", module: "Inventory", route: "/inventory/items", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "inventory.wms", name: "Warehouse management", module: "Inventory", route: "/inventory/warehouse-management", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "inventory.warehouses", name: "Warehouses", module: "Inventory", route: "/inventory/warehouses", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "inventory.adjustments", name: "Inventory adjustments", module: "Inventory", route: "/inventory-adjustments", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "inventory.transfers", name: "Inventory transfers", module: "Inventory", route: "/inventory-transfers", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "sales.invoices", name: "Invoices", module: "Finance", route: "/invoices", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "licensing.billing-history", name: "Billing history", module: "Licensing", route: "/licensing/billing-history", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "licensing.catalog", name: "Catalog", module: "Licensing", route: "/licensing/catalog", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "licensing.integrations", name: "Integrations", module: "Licensing", route: "/licensing/integrations", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "licensing.subscriptions", name: "Subscriptions", module: "Licensing", route: "/licensing/subscriptions", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "licensing.usage", name: "Usage", module: "Licensing", route: "/licensing/usage", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "manager-self-service", name: "Manager self service", module: "Administration", route: "/manager-self-service", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "manufacturing.work-orders", name: "Work orders", module: "Manufacturing", route: "/manufacturing/work-orders", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "notifications.inbox", name: "Notifications", module: "Notifications", route: "/notifications", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.payments", name: "Payments", module: "Finance", route: "/payments", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.arrears", name: "Arrears", module: "Payroll", route: "/payroll/arrears", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.bonus", name: "Bonus", module: "Payroll", route: "/payroll/bonus", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.components", name: "Components", module: "Payroll", route: "/payroll/components", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.final-settlement", name: "Final settlement", module: "Payroll", route: "/payroll/final-settlement", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.loans", name: "Loans", module: "Payroll", route: "/payroll/loans", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.payslips", name: "Payslips", module: "Payroll", route: "/payroll/payslips", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.reimbursements", name: "Reimbursements", module: "Payroll", route: "/payroll/reimbursements", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.runs", name: "Runs", module: "Payroll", route: "/payroll/runs", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.statutory", name: "Statutory", module: "Payroll", route: "/payroll/statutory", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.structures", name: "Structures", module: "Payroll", route: "/payroll/structures", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "payroll.tax-declarations", name: "Tax declarations", module: "Payroll", route: "/payroll/tax-declarations", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "sales.portal", name: "Portal", module: "Sales", route: "/portal", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "procurement.grn", name: "Goods receipt notes", module: "Procurement", route: "/procurement/goods-receipt-notes", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "procurement.orders", name: "Purchase orders", module: "Procurement", route: "/procurement/purchase-orders", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "procurement.purchase-requests", name: "Purchase requests", module: "Procurement", route: "/procurement/purchase-requests", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "procurement.vendors", name: "Vendors", module: "Procurement", route: "/procurement/vendors", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "administration.profile", name: "Profile", module: "Administration", route: "/profile", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "projects.tasks", name: "Tasks", module: "Projects", route: "/projects/tasks", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "projects.timesheets", name: "Timesheets", module: "Projects", route: "/projects/timesheets", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "reports.builder", name: "Builder", module: "Reports", route: "/reports/builder", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "reports.compliance", name: "Compliance", module: "Reports", route: "/reports/compliance", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "reports.custom", name: "Custom", module: "Reports", route: "/reports/custom", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "reports.financial", name: "Financial", module: "Reports", route: "/reports/financial", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "reports.hr", name: "Hr", module: "Reports", route: "/reports/hr", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "reports.operations", name: "Operations", module: "Reports", route: "/reports/operations", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "reports.payroll", name: "Payroll", module: "Payroll", route: "/reports/payroll", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "sales.discounts", name: "Discounts", module: "Sales", route: "/sales/discounts", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "sales.orders", name: "Orders", module: "Sales", route: "/sales/orders", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "sales.pricing", name: "Pricing", module: "Sales", route: "/sales/pricing", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "sales.quotations", name: "Quotations", module: "Sales", route: "/sales/quotations", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "sales.returns", name: "Returns", module: "Sales", route: "/sales/returns", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "security.access-logs", name: "Access logs", module: "Security", route: "/security/access-logs", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "security.ip-restrictions", name: "Ip restrictions", module: "Security", route: "/security/ip-restrictions", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "security.multi-factor-authentication", name: "Multi factor authentication", module: "Security", route: "/security/multi-factor-authentication", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "security.password-policies", name: "Password policies", module: "Security", route: "/security/password-policies", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "security.single-sign-on", name: "Single sign on", module: "Security", route: "/security/single-sign-on", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "inventory.stock-movements", name: "Stock movements", module: "Inventory", route: "/stock-movements", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "superadmin.dashboard", name: "Dashboard", module: "Administration", route: "/superadmin/dashboard", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "finance.tax-management", name: "Tax management", module: "Finance", route: "/tax-management", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
  { key: "procurement.vendor-bills", name: "Vendor bills", module: "Procurement", route: "/vendor-bills", isDynamic: true, version: 1, status: "Published", hardcodedFieldsEstimate: 0 },
];

export default function MigrationDashboardPage() {
  const [dynamicPages, setDynamicPages] = useState<UiPageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDynamicPages = async () => {
    try {
      setLoading(true);
      const res = await platformApi.uiPages.list();
      const list = Array.isArray(res.data) ? res.data : [];
      setDynamicPages(list);
    } catch {
      setDynamicPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDynamicPages();
  }, []);

  // Merge live dynamic pages with inventory
  const inventory = useMemo(() => {
    return ERP_PAGE_INVENTORY.map((item) => {
      const live = dynamicPages.find((p) => p.pageKey.toLowerCase() === item.key.toLowerCase());
      if (live) {
        return {
          ...item,
          name: live.title || item.name,
          isDynamic: true,
          version: live.publishedVersion || 1,
          status: (live.status as any) || "Published",
          hardcodedFieldsEstimate: 0,
        };
      }
      return item;
    });
  }, [dynamicPages]);

  const totalPages = inventory.length;
  const dynamicCount = inventory.filter((i) => i.isDynamic).length;
  const legacyCount = totalPages - dynamicCount;
  const migrationPct = Math.round((dynamicCount / totalPages) * 100);
  const pendingHardcodedFields = inventory.reduce((acc, i) => acc + i.hardcodedFieldsEstimate, 0);

  const filteredItems = inventory.filter((item) => {
    if (moduleFilter !== "all" && item.module !== moduleFilter) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "dynamic" && !item.isDynamic) return false;
      if (statusFilter === "legacy" && item.isDynamic) return false;
    }
    return true;
  });

  const modules = Array.from(new Set(inventory.map((i) => i.module))).sort();

  return (
    <StandardPageLayout
      title="Platform Migration & Architecture Dashboard"
      subtitle="Track the transition of hard-coded frontend views into configurable, metadata-driven pages."
      eyebrow="Architecture / Progress"
      icon="bar-chart"
      meta={
        <HeaderSummary
          items={[
            { label: "Total Monitored Pages", value: totalPages, tone: "default" },
            { label: "Metadata-Driven", value: `${dynamicCount} (${migrationPct}%)`, tone: "success" },
            { label: "Legacy Hard-coded", value: legacyCount, tone: "warning" },
            { label: "Pending Fields to Migrate", value: pendingHardcodedFields, tone: "info" },
          ]}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/administration/page-builder"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" /> Open Page Builder
          </Link>
          <button
            type="button"
            onClick={loadDynamicPages}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Migration Progress Card */}
        <CrudCard>
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Metadata Migration Progress ({migrationPct}%)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dynamicCount} of {totalPages} canonical pages migrated to the generic dynamic rendering engine.
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {dynamicCount} / {totalPages} Pages
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${migrationPct}%` }}
              />
            </div>
          </div>
        </CrudCard>

        {/* Filters and Inventory Table */}
        <CrudCard>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">ERP Page Inventory</h3>

              <div className="flex items-center gap-2">
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="erp-input text-xs w-40"
                >
                  <option value="all">All Modules</option>
                  {modules.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="erp-input text-xs w-36"
                >
                  <option value="all">All Statuses</option>
                  <option value="dynamic">Metadata Only</option>
                  <option value="legacy">Legacy Only</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden text-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-12 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <div className="col-span-4">Page / Key</div>
                <div className="col-span-2">Module</div>
                <div className="col-span-2">Architecture</div>
                <div className="col-span-2">Pending Fields</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filteredItems.map((item) => (
                <div
                  key={item.key}
                  className="grid grid-cols-12 gap-3 p-3.5 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="col-span-4 space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                    <span className="block font-mono text-[11px] text-slate-400">{item.key}</span>
                  </div>

                  <div className="col-span-2 text-slate-600 dark:text-slate-300 font-medium">{item.module}</div>

                  <div className="col-span-2">
                    {item.isDynamic ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Dynamic (v{item.version})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" /> Legacy Code
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 font-mono text-slate-500">
                    {item.isDynamic ? (
                      <span className="text-emerald-600 font-semibold">Migrated</span>
                    ) : (
                      <span>~{item.hardcodedFieldsEstimate} fields</span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={item.route}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Visit Route"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/administration/page-builder?page=${item.key}`}
                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                    >
                      {item.isDynamic ? "Edit Schema" : "Configure"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CrudCard>
      </div>
    </StandardPageLayout>
  );
}
