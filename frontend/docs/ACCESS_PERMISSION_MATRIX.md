# Access & Permission Matrix

Last updated: 2026-04-09
Scope: `frontend` protected routes

## Goal
Single source-of-truth mapping for route-level authorization between frontend and backend policy engine.

Authoritative code source:
- `src/config/route-permissions.config.ts`
- `src/constants/permissions.ts`

## Enforcement model
1. Route is canonicalized (legacy aliases normalize to `/erp/...` where applicable).
2. Matching rule is resolved from `ROUTE_PERMISSION_MATRIX`.
3. Access is granted when any permission key in resolved keyset is granted by backend (`/auth/permissions`).
4. There is **no frontend role-map fallback**; authorization is backend-authoritative.
5. If permission sync fails, routes remain blocked and user can retry permission refresh.

## Canonical route -> primary permission

### Operations (`erp`)
| Route | Permission |
|---|---|
| `/erp/dashboard` | `dashboard.view` |
| `/erp/notifications` | `notifications.view` |
| `/erp/documents` | `documents.view` |
| `/erp/chart-of-accounts` | `chartofaccounts.view` |
| `/erp/journal-entries` | `journalentries.view` |
| `/erp/payments` | `payments.view` |
| `/erp/approvals` | `approvals.view` |
| `/erp/customers` | `customer.view` |
| `/erp/sales-orders` | `salesorders.view` |
| `/erp/vendors` | `vendor.view` |
| `/erp/purchase-orders` | `purchaseorders.view` |
| `/erp/items` | `item.view` |
| `/erp/warehouses` | `warehouses.view` |
| `/erp/stock-movements` | `stockmovements.view` |

### HRMS (`hrms`)
| Route | Permission |
|---|---|
| `/erp/hrms` | `hrms.view` |
| `/erp/hrms/recruitment` | `recruitment.view` |
| `/erp/hrms/screening-schedule` | `screening.schedule.view` |
| `/erp/hrms/screening-results` | `screening.results.view` |
| `/erp/hrms/training` | `training.view` |
| `/erp/hrms/assessments` | `assessments.view` |
| `/erp/hrms/certificates` | `certificates.view` |
| `/erp/hrms/employees` | `employee.view` |
| `/erp/hrms/performance` | `performance.view` |
| `/erp/hrms/attendance` | `attendance.view` |
| `/erp/hrms/shifts` | `shifts.view` |
| `/erp/hrms/leave` | `leave.view` |
| `/erp/hrms/overtime` | `overtime.view` |
| `/erp/hrms/assets` | `hr.assets.view` |
| `/erp/hrms/payroll` | `hr.payroll.view` |

### Finance (`payroll`)
| Route | Permission |
|---|---|
| `/erp/payroll` | `payroll.view` |
| `/erp/payroll/runs` | `payroll.runs.view` |
| `/erp/payroll/structures` | `payroll.structures.view` |
| `/erp/payroll/components` | `payroll.components.view` |
| `/erp/payroll/payslips` | `payroll.payslips.view` |
| `/erp/payroll/statutory` | `payroll.statutory.view` |

### Reports (`reports`)
| Route | Permission |
|---|---|
| `/erp/reports` | `reports.view` |
| `/erp/reports/hr` | `reports.hr.view` |
| `/erp/reports/payroll` | `reports.payroll.view` |
| `/erp/reports/compliance` | `reports.compliance.view` |

### Platform (`platform`)
| Route | Permission |
|---|---|
| `/platform` | `platform.view` |
| `/platform/companies` | `platform.companies.view` |
| `/platform/tenants` | `platform.tenants.view` |
| `/platform/projects` | `platform.projects.view` |
| `/platform/users` | `platform.users.view` |
| `/platform/roles` | `platform.roles.view` |
| `/platform/settings` | `platform.settings.view` |
| `/platform/feature-flags` | `platform.featureflags.view` |
| `/platform/contact-submissions` | `platform.contactsubmissions.view` |
| `/platform/audit-logs` | `audit.view` |

### Licensing (`licensing`)
| Route | Permission |
|---|---|
| `/erp/licensing` | `licensing.view` |
| `/erp/licensing/catalog` | `licensing.catalog.view` |
| `/erp/licensing/subscriptions` | `licensing.subscriptions.view` |
| `/erp/licensing/integrations` | `licensing.integrations.view` |

### Security (`security`)
| Route | Permission |
|---|---|
| `/erp/security` | `security.view` |
| `/erp/security/sessions` | `security.sessions.view` |
| `/erp/security/mfa` | `security.mfa.view` |
| `/erp/security/devices` | `security.devices.view` |
| `/erp/security/password-policies` | `security.passwordpolicies.view` |

## Backend sync checklist
- [ ] Add/verify all above permission keys in backend permission seed/migration.
- [ ] Ensure `/auth/permissions` returns keys in normalized lowercase format.
- [ ] For non-admin roles, map each role-policy to the required route keys.
- [ ] Validate 403 behavior for unauthorized routes and notification APIs.
- [ ] Add integration test: route + permission key mismatch should fail CI.

## Notes
- Legacy aliases like `/customers` are internally canonicalized to `/erp/customers` for policy lookup.
- Topbar notification polling uses silent-error mode to avoid global red error spam on expected 403 responses.
- Frontend does not maintain any static `role -> route` authorization table.
