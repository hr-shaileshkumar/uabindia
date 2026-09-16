# 11 — Metadata Candidate Mapping

## Executive Summary
Out of 192 frontend pages, 142 pages (74%) are high-value candidates for metadata-driven rendering, while 50 pages (26%) should remain custom React components.

## Metadata Candidates by Functional Layer

| Layer | Metadata Entity | Storage | Description |
| :--- | :--- | :--- | :--- |
| **Page Layout** | `UiPageDefinition` | Relational DB + Redis | Page title, subtitle, breadcrumbs, default view mode |
| **Data Grid Columns** | `UiPageDefinition.SchemaJson.columns` | JSON Document | Key, label, dataType, width, sortable, filterable, align |
| **Filter Bar** | `UiPageDefinition.SchemaJson.filters` | JSON Document | Filter key, type (text, select, dateRange), options source |
| **Form Fields** | `UiPageDefinition.SchemaJson.form` | JSON Document | Form sections, field layout, validation rules, input type |
| **Lookups & Dropdowns** | `LookupDefinition` | Database Table | Dynamic master-data key-value pairs |
| **Action Buttons** | `UiPageDefinition.SchemaJson.actions` | JSON Document | Top-bar and row-level actions (Export, Create, Batch Delete) |
| **KPI Scorecards** | `UiPageDefinition.SchemaJson.kpiMetrics` | JSON Document | Cards displaying count, amount, trend indicator |
| **Navigation** | `NavigationMenu` | Database Table | Hierarchical menu tree, icon, badge, role requirements |
