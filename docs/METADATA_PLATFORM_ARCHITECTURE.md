# UAB India ERP — Metadata-Driven Architecture & Page Builder Manual
**Classification:** Enterprise Platform Architecture  
**Author:** Chief Developer & Principal Software Architect  
**Version:** 2.0.0

---

## 1. System Overview

UAB India ERP has transitioned from a hard-coded frontend architecture into a **production-grade, metadata-driven, configurable ERP platform**. 

Authorized administrators can create, customize, and publish ERP pages, data tables, multi-section forms, filters, and actions through the **No-Code Page Builder Studio** (`/administration/page-builder`) without modifying or deploying frontend React code.

```
                   UAB INDIA ERP
                         │
                ┌────────┴────────┐
                │   Platform      │
                │ Configuration    │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              │    Metadata Engine   │
              └──────────┬──────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
   Page Builder      Permission       Navigation
  (/page-builder)      Engine          (/navigation)
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                  Dynamic Renderer
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      Dynamic       Dynamic        Dynamic
       Table          Form          Detail
          │              │              │
          └──────────────┼──────────────┘
                         │
                       APIs
                         │
                    Backend (.NET)
                         │
                  Database (MSSQL)
```

---

## 2. Core Architecture: Backend vs Frontend Contract

### The Backend Controls: WHAT
1. **Entity Models & Discovery**: Discovers core fields via `IEntityMetadataService` and custom fields via `EntityFieldDefinition`.
2. **Page Identity & Layout Schemas**: Stored in `UiPageDefinition` and versioned in `UiPageVersion`.
3. **Data Integrity & Server Validation**: Enforces permissions, required constraints, data types, and business rules.
4. **REST Endpoints**: `/api/v1/ui-pages` for schema management and `/api/v1/{module}/{entity}` for entity records.

### The Frontend Controls: HOW
1. **Visual Presentation & Design System**: Rendered using canonical `ErpPageShell` and Tailwind CSS v4 tokens.
2. **Dynamic Components**:
   - `DynamicPage`: Orchestrates data fetching, search, filtering, drawer modal, and CSV export.
   - `DynamicTable`: Renders responsive data tables with cell formatters (status badges, formatted currency, localized dates).
   - `DynamicForm`: Multi-section responsive form with input validation.
   - `DynamicFieldRegistry`: Field type mapper supporting text, textarea, currency, select, lookup, etc.
3. **Safe Dual-Render Mode**: Supports progressive migration with automatic fallback to legacy hard-coded components.

---

## 3. Schema JSON Specification

A published page schema conforms to `DynamicPageSchema`:

```json
{
  "schemaVersion": "1",
  "pageKey": "hrms.employees",
  "title": "Employee Master",
  "subTitle": "Workforce records, contract status, and organizational deployment.",
  "entityName": "Employee",
  "viewType": "table",
  "apiEndpoint": "/api/v1/hrms/employees",
  "kpiMetrics": [
    {
      "label": "Total Workforce",
      "tone": "info",
      "icon": "Users",
      "subtext": "Registered personnel"
    },
    {
      "label": "Active Personnel",
      "tone": "positive",
      "icon": "CheckCircle2",
      "subtext": "Active payroll"
    }
  ],
  "columns": [
    {
      "key": "employeeCode",
      "label": "Emp Code",
      "dataType": "string",
      "sortable": true,
      "sortOrder": 1,
      "width": "120px"
    },
    {
      "key": "fullName",
      "label": "Employee Name",
      "dataType": "string",
      "sortable": true,
      "sortOrder": 2,
      "width": "220px"
    },
    {
      "key": "monthlyCtc",
      "label": "Monthly CTC",
      "dataType": "currency",
      "sortable": true,
      "sortOrder": 3,
      "width": "150px"
    },
    {
      "key": "status",
      "label": "Status",
      "dataType": "badge",
      "sortable": true,
      "filterable": true,
      "sortOrder": 4,
      "width": "120px"
    }
  ],
  "filters": [
    {
      "key": "search",
      "label": "Search Employee",
      "filterType": "text",
      "placeholder": "Search code, name, email…"
    },
    {
      "key": "status",
      "label": "Status",
      "filterType": "select",
      "options": [
        { "value": "all", "label": "All Statuses" },
        { "value": "Active", "label": "Active" },
        { "value": "Inactive", "label": "Inactive" }
      ]
    }
  ],
  "form": {
    "sections": [
      {
        "title": "Personal Details",
        "description": "Demographic and contact information",
        "fields": [
          {
            "key": "fullName",
            "label": "Full Name",
            "fieldType": "text",
            "required": true,
            "placeholder": "Enter full name"
          },
          {
            "key": "workEmail",
            "label": "Work Email",
            "fieldType": "email",
            "required": true
          }
        ]
      }
    ]
  },
  "actions": [
    {
      "key": "create",
      "label": "New Employee",
      "actionType": "button",
      "variant": "primary",
      "requiredPermission": "employee.create"
    },
    {
      "key": "edit",
      "label": "Edit",
      "actionType": "button",
      "variant": "secondary",
      "requiredPermission": "employee.edit"
    },
    {
      "key": "delete",
      "label": "Delete",
      "actionType": "button",
      "variant": "danger",
      "requiredPermission": "employee.delete"
    },
    {
      "key": "export",
      "label": "Export CSV",
      "actionType": "button",
      "variant": "secondary",
      "requiredPermission": "employee.view"
    }
  ]
}
```

---

## 4. Backend Database Storage Model

### `UiPageDefinitions` (Header Table)
* `Id` (GUID)
* `TenantId` (GUID) — Multi-tenant partition
* `PageKey` (nvarchar(150)) — Canonical identifier (e.g. `hrms.employees`)
* `EntityName` (nvarchar(100)) — Associated entity
* `Title` (nvarchar(200))
* `ModuleKey` (nvarchar(100)) — Grouping (e.g. `hrms`, `finance`)
* `ViewType` (nvarchar(50)) — `table` | `cards` | `split`
* `RoutePath` (nvarchar(250)) — Browser URL
* `Icon` (nvarchar(50)) — Lucide icon key
* `Status` (nvarchar(50)) — `Draft` | `Published` | `Archived`
* `PublishedVersion` (int) — Version currently served to users
* `DraftVersion` (int) — Working draft version
* `AddToNavigation` (bit) — Mount into dynamic sidebar navigation

### `UiPageVersions` (Version Snapshot Table)
* `Id` (GUID)
* `PageDefinitionId` (GUID FK)
* `Version` (int) — Sequential integer (1, 2, 3...)
* `SchemaJson` (nvarchar(max)) — Complete schema JSON
* `ChangeSummary` (nvarchar(500)) — Changelog note
* `IsPublished` (bit)
* `PublishedAt` (datetime2)
* `PublishedBy` (GUID)

---

## 5. API Contracts

| Method | Endpoint | Description | Auth Roles |
|---|---|---|---|
| `GET` | `/api/v1/ui-pages` | List all configured page definitions | Authenticated |
| `GET` | `/api/v1/ui-pages/{pageKey}` | Fetch active published schema (or `?draft=true`) | Authenticated |
| `POST` | `/api/v1/ui-pages` | Register a new page definition | SuperAdmin, Admin |
| `PUT` | `/api/v1/ui-pages/{pageKey}` | Save draft schema version | SuperAdmin, Admin |
| `POST` | `/api/v1/ui-pages/{pageKey}/publish` | Validate and publish version to live | SuperAdmin, Admin |
| `POST` | `/api/v1/ui-pages/{pageKey}/rollback` | Roll back to specified version number | SuperAdmin, Admin |
| `DELETE` | `/api/v1/ui-pages/{pageKey}` | Archive page definition | SuperAdmin, Admin |
| `GET` | `/api/v1/ui-pages/entities` | List discoverable business entities | Authenticated |
| `GET` | `/api/v1/ui-pages/entities/{entity}/fields` | Discovered schema fields (core + custom) | Authenticated |

---

## 6. How to Migrate a Page Progressively

To convert any hard-coded page (e.g., `ShiftList.tsx` or `DepartmentList.tsx`) without breaking existing code:

1. **Open Page Builder**:
   Navigate to `/administration/page-builder`.
2. **Select Entity**:
   Choose the target entity (e.g., `Department`). Discovered fields will appear automatically.
3. **Configure Columns & Form**:
   Select which fields appear as table columns and arrange form sections.
4. **Preview Live**:
   Switch to the **6. Interactive Live Preview** tab and test record creation/filtering.
5. **Publish**:
   Click **Publish Live**. This generates a new published version in the database.
6. **Update Page Route**:
   In `frontend/src/app/(protected)/hrms/departments/page.tsx`, simply wrap with `DynamicPage`:
   ```tsx
   import { DynamicPage } from "@/components/dynamic/DynamicPage";
   import LegacyDepartments from "@/features/hrms/components/LegacyDepartments";

   export default function DepartmentsPage() {
     return (
       <DynamicPage
         pageKey="administration.departments"
         fallback={<LegacyDepartments />}
         renderMode="auto"
       />
     );
   }
   ```
7. **Monitor**:
   Check `/administration/migration-dashboard` to view updated migration percentage and verify system health.
