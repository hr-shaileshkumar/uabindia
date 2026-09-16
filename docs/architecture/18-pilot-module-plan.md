# 18 — Pilot Module Implementation Plan

## Pilot Selection Rationale: Administration / Master Data & Organization Structure
The **Administration / Master Data** module is selected as the ideal pilot over HRMS for the following architectural reasons:
1. **Isolated Risk**: Master-data pages have low transactional coupling and zero risk to payroll or financial ledgers.
2. **High Standard CRUD Density**: Pages consist of structured lists, search, create/edit modal forms, and status toggles.
3. **Immediate Universal Value**: Every other module (HRMS, Payroll, Finance, Sales) depends on Branches, Departments, Designations, and Cost Centers.
4. **Fast Validation Loop**: Proves the `DynamicTable` and `DynamicForm` contracts end-to-end with real users before touching complex domains.

## Target Pilot Pages (The First 5)

| # | Page Route | Entity | Complexity | Test Success Metric |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `/administration/departments` | `Department` | Low | Dual-render match; CRUD works via Dynamic Drawer |
| 2 | `/administration/designations` | `Designation` | Low | Instant search & department lookup dropdown |
| 3 | `/administration/branches` | `Branch` | Medium | Geo location bindings, status toggle, export |
| 4 | `/administration/cost-centers` | `CostCenter` | Medium | Company scope filter, budget field validation |
| 5 | `/procurement/vendors` | `Vendor` | Medium-High | Multi-field validation, contact tabs, GST/PAN validation |

## Pilot Implementation Steps
1. Seed database with `UiPageDefinition` records for the 5 pilot pages.
2. Add toggle `useDynamicRenderer: true` in tenant configuration.
3. Verify fallback mode works automatically if schema endpoint is unreachable.
4. Validate zero regressions in existing tests.
