# 12 — Metadata Platform Architecture Design

## Core Architecture Contract
The metadata engine follows a strict separation of concerns:
- **Backend**: System of record for metadata schema, security validation, data discovery, and business logic execution.
- **Frontend**: High-performance client runtime that interprets metadata schemas and renders optimized UI components with 0 runtime compilation overhead.

```
                     +---------------------------------------+
                     |         Database Schema Tables        |
                     |  - UiPageDefinitions                  |
                     |  - UiPageVersions                     |
                     |  - EntityFieldDefinitions             |
                     |  - LookupDefinitions                  |
                     +---------------------------------------+
                                         │
                                         ▼
                     +---------------------------------------+
                     |         Metadata API Service          |
                     |  - MemoryCache / Redis (TTL: 1 hour)  |
                     |  - Tenant Scope Overrides             |
                     |  - Role Permission Trimming          |
                     +---------------------------------------+
                                         │
                                         ▼ GET /api/v1/ui-pages/{pageKey}
                     +---------------------------------------+
                     |       Frontend Metadata Client        |
                     |  - SWR / TanStack Query (staleWhileRevalidate)|
                     |  - Fallback to Static Schema on Error |
                     +---------------------------------------+
                                         │
                                         ▼
                     +---------------------------------------+
                     |        DynamicPage Renderer           |
                     |  - DynamicTable (Virtual Grid)        |
                     |  - DynamicForm (Zod Schema Generated) |
                     |  - DynamicFilterBar                   |
                     |  - DynamicActionDrawer                |
                     +---------------------------------------+
```

## Multi-Tenant Metadata Resolution Rules
1. **System Default Metadata**: Created at platform installation (`TenantId = NULL`).
2. **Tenant Custom Metadata**: Specific customizations created by a tenant admin (`TenantId = CurrentTenant`). Overrides system defaults.
3. **Company Custom Metadata**: Specific branch/company variations (`CompanyId = CurrentCompany`).
4. **Resolution Cascade**: `Company Override` -> `Tenant Override` -> `Platform System Default`.
