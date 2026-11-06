# 17 — Migration Waves & Execution Roadmap

## Wave-by-Wave Migration Plan

```text
[Wave 0: Foundation] ──► [Wave 1: Pilot 5 Pages] ──► [Wave 2: 20 Core CRUD] ──► [Wave 3: Master Data]
                                                                                      │
[Wave 7: Specialized] ◄── [Wave 6: Dashboards] ◄── [Wave 5: Workflows] ◄── [Wave 4: Heavy Modules]
         │
         ▼
[Wave 8: Cleanup]
```

### Wave 0 — Architecture Foundation (Pre-requisite)
- Finalize schema JSON specification.
- Implement `DynamicTable`, `DynamicForm`, `DynamicFilterBar`.
- Deploy `UiPageMetadataService` and Redis caching layer.
- Zero business page modifications.

### Wave 1 — Pilot Wave (5 Target Pages)
1. `/administration/departments` (Master Data Reference)
2. `/administration/designations` (Master Data Reference)
3. `/administration/branches` (Organization Master)
4. `/inventory/items` (High-density Item Catalog)
5. `/procurement/vendors` (Commercial Supplier Directory)

### Wave 2 — High-Impact Common Pages (20 Pages)
- Core Employee List, Customer Master, Sales Quotation List, Purchase Requests.

### Wave 3 — Reference & Master-Data (30 Pages)
- Shifts, Leave Policies, Cost Centers, Business Units, Currencies, Tax Slabs.

### Wave 4 — Heavy Commercial Modules (30 Pages)
- Sales Orders, Purchase Orders, Warehouses, Stock Transfers.

### Wave 5 — Workflow & Approvals (15 Pages)
- Leave Approvals, Expense Approvals, Purchase Order Approvals, Multi-level chains.

### Wave 6 — Dashboards & Analytics (15 Pages)
- HR Dashboard, Finance Dashboard, Inventory Dashboard, Sales KPI Dashboard.

### Wave 7 — Specialized Domain Pages (15 Pages)
- Depreciation Schedules, Fleet Fuel Logs, EDI Document Viewer, Work Orders.

### Wave 8 — Legacy Cleanup & Sunset
- Remove dead redirect aliases, clean up unused legacy components.
