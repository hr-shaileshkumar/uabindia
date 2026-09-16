# 16 — Migration Priority & Scoring Matrix

## Prioritization Methodology
Pages are scored across 6 dimensions to compute the **Migration Priority Index (MPI)**:
1. **Business Importance (Weight: 25%)**
2. **Hardcoding Intensity (Weight: 25%)**
3. **Similarity to Standard CRUD (Weight: 20%)**
4. **Reusability Potential (Weight: 15%)**
5. **Technical Risk (Weight: 15% - Inverted)**

## Priority Tier Classification

| Tier | Description | Target Page Types | Page Count |
| :--- | :--- | :--- | :--- |
| **P0** | **Architecture Blockers** | Schema Manager, Navigation Engine, Role Permissions, Entity Builder | 6 pages |
| **P1** | **High-Value Common Pages** | Employees, Vendors, Customers, Items, Invoices, Purchase Orders | 24 pages |
| **P2** | **Standard Master & CRUD** | Departments, Designations, Branches, Warehouses, Shifts, Cost Centers | 48 pages |
| **P3** | **Specialized Modules** | Work Orders, Depreciation, Travel Requests, Fleet, Training | 42 pages |
| **P4** | **Static & Low-Frequency** | Marketing, Terms, Privacy, Legacy Aliases, Developer Center | 72 pages |
