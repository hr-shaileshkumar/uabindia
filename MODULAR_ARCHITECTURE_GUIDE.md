# UABIndia Enterprise ERP / SaaS Platform
## Master Enterprise Platform Architecture, Metadata Specification & Implementation Guide

**Platform:** UABIndia ERP / SaaS Platform  
**Technology Stack:** Next.js 16.x + React 19.x + TypeScript 5.x | ASP.NET Core (.NET 10) | SQL Server 2022+ | REST API | SignalR  
**Architecture Paradigm:** Multi-Engine, Metadata-Driven, Multi-Tenant UAB India Enterprise Suite featuring server-authoritative enterprise governance, full-cycle HCM workflows, modular domain extensibility, and modern SaaS administration.

---

## 1. Executive Architecture Vision & Core Philosophy

The UABIndia ERP platform is engineered around an architectural foundation where **business logic, security, multi-tenancy, data scopes, and workflows are strictly server-authoritative (.NET 10)**, while the **frontend (Next.js 16 App Router) acts as a high-performance, reactive rendering engine**.

### 1.1 From Bespoke Coding to Multi-Engine Architecture
Rather than hardcoding hundreds of independent forms and tables, the platform operates on an extensible:
> **Multi-Engine + Metadata Catalog + Workflow + Security Scopes + Event Bus + Extension Architecture**

```
                     UABINDIA ENTERPRISE ERP PLATFORM
                                    │
 ┌──────────────────────────────────┼──────────────────────────────────┐
 │                                  │                                  │
 ▼                                  ▼                                  ▼
Experience Layer (Next.js 16)   Application Layer (.NET 10)         Platform Core
 │                                  │                                  │
 ├─ Desktop Workspace Shell         ├─ HRMS & Talent Lifecycle         ├─ Multi-Tenancy Engine
 ├─ Mobile / PWA Client             ├─ Payroll & Statutory Engine      ├─ Organization Hierarchy
 ├─ ESS / MSS Portals               ├─ Finance & Double-Entry GL       ├─ ABAC / RBAC Security
 └─ Visual Page Studio              ├─ Procurement & Supply Chain      ├─ Data Scope Engine
                                    ├─ Inventory & WMS Ledger          ├─ Event Outbox & Bus
                                    ├─ Sales, CRM & Billing            └─ Background Workers
                                    └─ Projects & Field Service
 │
 ▼
                       METADATA & GOVERNANCE ENGINE
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
   Page Schema                 Form Schema                  Workflow Schema
       │                            │                            │
       ├── Layout & Hierarchy       ├── 25+ Field Registry       ├── States & Steps
       ├── Views (20 Engines)       ├── Dynamic Validation       ├── Multi-Tier Approval
       ├── Action Contracts         ├── Conditional Rules        ├── SLA & Escalations
       └── Data / Field Scopes      └── Cascading Lookups        └── Domain Entity Sync
                                    │
                                    ▼
                         UI RENDERER ENGINES
 ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
 ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼
List     Object    Form      Kanban    Calendar  Tree      Report    Pivot
 ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼
Timeline Map       Matrix    Wizard    Studio    Search    Print     Mobile
                                    │
                                    ▼
                             API PLATFORM
                                    │
                  ┌─────────────────┼─────────────────┐
                  ▼                 ▼                 ▼
             CQRS Queries     CQRS Commands     Domain Events
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    ▼
                             DOMAIN SERVICES
                                    │
                   ┌────────────────┼────────────────┐
                   ▼                ▼                ▼
             SQL Server 2022   Distributed Cache   Worker (Hangfire)
             (17 Schemas)      (Redis / Memory)    (Async Streaming)
```

---

## 2. Master Page Engine Taxonomy (20 Reusable Engines)

Enterprise ERP systems cannot be reduced to simple list and form views. UABIndia formally defines **20 distinct, reusable Page Engines**:

| # | Page Engine | Primary Purpose | Key Architectural Features | Target Modules / Screens |
|---|---|---|---|---|
| **1** | **List Report Engine** | High-density data grid for tabular master & transactional data. | Sticky header, multi-column sort, column chooser, search/dropdown filters, row selection, bulk action bar, dense/comfortable modes. | Employees, Customers, Vendors, Invoices, Items, POs. |
| **2** | **Object / Detail 360 Engine** | Unified 360-degree view of a single domain entity. | KPI header facet cards, collapsible sections, child collection tabs, audit side panel, print preview. | Employee 360, Customer 360, Project Dashboard. |
| **3** | **Form Engine** | Multi-layout data entry and record mutation interface. | 1/2/3-column layouts, sections, tabs, accordion, side drawer, split view, field-level security, cascading lookups. | DynamicForm, Record Create/Edit across all entities. |
| **4** | **Global Search Engine** | Fast, cross-module exploratory search and instant navigation. | Exact match, prefix match, fuzzy match, module filters, recent items cache, keyboard shortcut (`Ctrl+K`). | Global Search Bar, Cross-Entity Entity Finder. |
| **5** | **Calendar Engine** | Time-based scheduling, rosters, and operational dates. | Month, week, day, agenda views, drag-to-reschedule, status coloring, recurring events. | Employee Shifts, Leave Rosters, Production Schedules. |
| **6** | **Timeline Engine** | Chronological milestone and lifecycle audit tracking. | Vertical step progression, actor avatars, relative timestamps, document status changes, audit comments. | Record Audit History, Order Fulfillment Pipeline. |
| **7** | **Tree / Hierarchy Engine** | Multi-level parent-child structural navigation. | Expand/collapse nodes, running debit/credit rollups, drag-and-drop node re-parenting, search node filter. | Chart of Accounts, Organization Chart, BOM. |
| **8** | **Master-Detail Engine** | Split view linking primary document with child line items. | Synchronized header and line item grid, automatic line calculation (Quantity × Price), tax breakups. | Sales Invoices, Purchase Orders, Journal Entries. |
| **9** | **Report Engine** | Aggregated tabular reporting with groupings and totals. | Group by column, sum/average totals, collapsible groups, export to Excel/CSV with formatting. | Trial Balance, Sales by Region, Inventory Valuation. |
| **10** | **Pivot Engine** | Multi-dimensional cross-tabulation and drill-down. | Drag row/column dimensions, aggregation functions (Sum, Count, Min, Max), interactive drill-through. | Sales Performance, HR Cost Analysis, Budget vs Actual. |
| **11** | **Chart & Analytics Engine**| Executive telemetry and operational KPI visualization. | 12-column drag-and-drop grid, Recharts (Bar, Line, Area, Pie, Heatmap, Gauge), layout persistence. | Executive Dashboard, Financial Health Dashboard. |
| **12** | **Map / GIS Engine** | Geospatial visualization of assets, field jobs, and routes. | Interactive pins, clustering, geofence radius visualizer, route playback, asset tracking. | Field Service, Fleet Management, Attendance Geofence. |
| **13** | **Document & Attachment Engine**| Secure file lifecycle management with cloud storage. | Drag-drop upload, versioning, preview viewer (PDF, Images), tenant-isolated cloud partitioning (`IStorageProvider`). | Invoice Receipts, Employee KYC, Contract Documents. |
| **14** | **Import / Export Engine** | High-throughput data ingestion and extraction. | Column auto-mapping, dry-run schema validation, UTF-8 CSV/TSV/JSON streaming, background worker queueing. | Bulk Data Migration, Catalog Exports. |
| **15** | **Notification Center Engine** | Centralized multi-channel alerts and real-time updates. | In-app notification drawer, priority badges (Urgent, Info), SignalR real-time dispatch, mark as read. | Workflow Alerts, System Warnings, Job Progress. |
| **16** | **Task & Worklist Engine** | Operational work queues and assignment boards. | Due dates, priority levels, assignment toggles, SLA countdowns, 1-click completion. | Project Tasks, Helpdesk Tickets, HR Action Items. |
| **17** | **Exception Center Engine** | Centralized anomaly, validation error, and issue triage. | Triage severity (Critical, Warning), grouped anomaly rules (missing PAN, invalid GSTIN, unmapped GL). | Statutory Compliance Audit, Integration Failures. |
| **18** | **Print & Document Template Engine**| Pixel-perfect, brand-compliant document rendering. | HTML/CSS templates, PDF generation, variables substitution, QR codes, barcodes, digital signature blocks. | Payslips, Tax Invoices, Purchase Orders, Offer Letters. |
| **19** | **Mobile / Responsive Workspace**| Touch-optimized, low-bandwidth operational interface. | Responsive card grids, bottom action sheets, offline queueing, camera/GPS integration. | Employee Self-Service (ESS), Field Service Mobile. |
| **20** | **Configuration & Page Studio**| No-code visual studio for runtime page customization. | Entity selector, drag-and-drop layout builder, field properties inspector, validation builder, preview & publish. | Visual Page Designer, UI Customization Studio. |

---

## 3. Deep Metadata Contract Specification

To prevent "metadata-driven" from devolving into arbitrary ad-hoc JSON, UABIndia establishes a formal, strongly-typed contract in `Backend/src/UabIndia.Core/Metadata/MetadataContracts.cs` and `frontend/src/lib/dynamic-schema/types.ts`:

```
PageDefinitionSchema (v2.1)
│
├── Identity & Lifecycle
│   ├── PageKey: string ("hrms.employees", "finance.invoices")
│   ├── EntityName: string ("Employee", "SalesInvoice")
│   ├── ModuleKey: string ("hrms", "finance", "procurement")
│   ├── Title: string & SubTitle?: string
│   ├── Version: int (1, 2, 3...)
│   └── Status: string ("Draft" | "Validate" | "Published" | "Archived")
│
├── View Engine Configuration (ViewDefinition)
│   ├── ViewType: PageViewType (Table, Form, Kanban, Tree, Pivot, Calendar, Timeline...)
│   ├── VisibleColumns: List<string>
│   ├── Filters: List<FilterDefinition> (FieldKey, Label, FilterType, OptionsEndpoint)
│   ├── Actions: List<ActionDefinition> (ActionKey, Label, Icon, Type, Endpoint, Permission)
│   ├── DefaultSortBy: string & DefaultSortDescending: bool
│   └── DefaultPageSize: int (25, 50, 100)
│
├── Form & Layout Engine Configuration (FormDefinition)
│   ├── Layout: LayoutDefinitionContract
│   │   ├── Type: LayoutType (Tabs | Accordion | Wizard | SplitView | Drawer | FullPage | Modal)
│   │   ├── DefaultColumns: int (1 | 2 | 3 | 4)
│   │   ├── Density: string ("compact" | "standard" | "comfortable")
│   │   ├── EnableSplitView: bool
│   │   └── EnableSideDrawer: bool
│   ├── Tabs: List<TabDefinition> (TabKey, Label, Icon, DisplayOrder, SectionKeys, VisibleWhen)
│   ├── Sections: List<SectionDefinition> (SectionKey, Title, Columns, Collapsible, VisibleWhen)
│   ├── Fields: List<FieldDefinitionContract>
│   └── Relationships: List<RelationshipDefinitionContract>
│
├── Field Component Registry (25+ Controls)
│   ├── FieldKey, Label, ControlType (MetadataControlType)
│   ├── Placeholder, HelpText, DefaultValue
│   ├── Validation: ValidationDefinition (IsRequired, Min, Max, MinLength, MaxLength, Regex)
│   ├── ConditionalRules: ConditionalRulesContract (VisibleWhen, RequiredWhen, ReadonlyWhen...)
│   ├── Security: FieldSecurityContract (MaskType, RestrictedRoles, RestrictedPermissions)
│   └── Lookup: LookupEndpoint, LookupEntityName, FormulaExpression
│
├── Relationship & Child Table Engine (RelationshipDefinitionContract)
│   ├── RelationshipKey: string ("LineItems", "Leaves", "Documents")
│   ├── Type: RelationshipType (OneToOne | OneToMany | ManyToOne | ManyToMany | ParentChild | ChildGrid)
│   ├── TargetEntity: string ("SalesInvoiceLine", "Attendance")
│   ├── ForeignKey: string ("InvoiceId", "EmployeeId")
│   └── CascadeDelete: bool
│
├── Action & Command Engine (ActionDefinition)
│   ├── ActionKey, Label, Icon, ActionType ("apiCall", "workflowTrigger", "clone", "export", "print")
│   ├── ApiEndpoint, HttpMethod, RequiredPermission, IsBulkAction
│   ├── ConfirmationMessage?: string & RequireReason: bool
│   ├── WorkflowTriggerKey?: string & AuditEventName?: string
│   └── NotificationChannels: List<string> ("inApp", "email", "sms")
│
├── Search Architecture Contract (SearchContract)
│   ├── IsSearchable: bool
│   ├── ExactMatchFields: List<string> (Code, PanNumber, InvoiceNumber)
│   ├── PrefixMatchFields: List<string> (FirstName, LastName, CustomerName)
│   └── FuzzyMatchFields: List<string> (Description, Notes)
│
└── Document & Print Template Contracts (DocumentTemplateContract)
    ├── TemplateKey, Title, OutputFormat ("pdf" | "html" | "docx" | "print")
    ├── HeaderHtml, BodyTemplate, FooterHtml, Variables
    └── HasBarcode: bool, HasQrCode: bool, HasDigitalSignature: bool
```

---

## 4. Master 25+ Field Component Registry

Every data entry control in the platform is mapped to a strictly typed component in the frontend registry (`DynamicFieldRegistry.tsx`):

| Control Type | Data Type | UI Component Behavior & Rendering | Enterprise Example |
|---|---|---|---|
| **Text** | `string` | Standard single-line input with length & regex validation. | Employee Code, Branch Code. |
| **Number** | `double/long` | Numeric input with step, min, max, and integer checks. | Quantity, Headcount, Days. |
| **Currency** | `decimal` | Formatted monetary input with currency prefix and comma separator. | Basic Pay, Unit Price, Total CTC. |
| **Percentage**| `decimal` | Numerical percentage with suffix (`%`) and 0–100 limits. | GST Rate, Discount %, TDS Rate. |
| **Date** | `DateOnly` | Enterprise calendar picker with min/max and disabled dates. | Date of Birth, Invoice Date. |
| **DateTime** | `DateTime` | Date picker with time selector and timezone conversion. | Punch In Time, Audit Timestamp. |
| **Time** | `TimeOnly` | Dedicated 24h / 12h time input with interval stepping. | Shift Start Time, Grace Period. |
| **Boolean** | `bool` | Toggle switch with semantic active/inactive state. | Is Active, Tax Exempt. |
| **Dropdown** | `string` | Single select dropdown with static options catalog. | Employment Type, Gender. |
| **MultiSelect**| `List<string>`| Multi-tag pill selector with keyboard tokenization. | Skills, Industry Verticals. |
| **Radio** | `string` | Radio group for mutually exclusive options (< 5 items). | Tax Regime (Old vs New). |
| **Checkbox** | `bool` | Standard binary checkbox. | Terms Agreed, Overtime Eligible. |
| **Lookup** | `Guid/string`| Dynamic server-side autocomplete with search debounce. | Cost Center Lookup, Item Code. |
| **EntityLookup**| `Guid` | Cross-entity lookup with drawer preview and inline create. | Customer ID, Vendor ID. |
| **UserLookup** | `Guid` | User avatar selector filtered by active tenant users. | Assigned To, Created By. |
| **EmployeeLookup**| `Guid` | Employee badge selector with department & designation subtitle. | Reporting Manager, Approver. |
| **CompanyLookup** | `Guid` | Legal company entity selector for multi-company tenants. | Billing Company, Posting Entity. |
| **ProjectLookup** | `Guid` | Active project selector scoped by tenant and company. | Billable Project, Cost Center. |
| **LocationLookup**| `Guid` | Hierarchical geographical location selector. | Posting Location, Warehouse Bin. |
| **File** | `string (URL)`| Drag-and-drop file uploader with tenant S3/Azure partitioning. | PAN Card Proof, Resume PDF. |
| **Image** | `string (URL)`| Image uploader with instant thumbnail preview and crop tool. | Employee Photo, Item Image. |
| **RichText** | `string (HTML)`| WYSIWYG editor with bold, italic, lists, and tables. | Job Description, Contract Terms. |
| **TextArea** | `string` | Multi-line text field with auto-expanding height. | Rejection Reason, Internal Notes. |
| **Phone** | `string` | Phone input with international country code selector. | Mobile Number, Emergency Contact. |
| **Email** | `string` | Email input with RFC 5322 syntax validation. | Official Email ID, Billing Email. |
| **Rating** | `int` | Star / numerical rating control. | Performance Review Score. |
| **Formula** | `computed` | Read-only dynamically evaluated formula field. | `BasicPay + HRA + SpecialAllowance`.|
| **ReadOnly** | `any` | Non-editable display field with copy-to-clipboard button. | System ID, Auto Sequence Number. |
| **Password** | `string` | Masked secure text input with password strength meter. | User Password, API Secret. |
| **Signature** | `string (PNG)`| Canvas pad for drawing digital signatures. | Gate Pass Signoff, Delivery Sign. |
| **GPS** | `(lat, lng)`| Geolocation pin selector with current location detector. | Attendance Punch Location. |
| **Custom** | `ReactNode` | Extension slot for module-specific custom React widgets. | Barcode Scanner Widget. |

---

## 5. Dynamic Rules & Conditional UI Engine

Instead of writing bespoke React `if/else` state hooks, forms declare conditional visibility and validation in metadata:

```json
{
  "fieldKey": "contractEndDate",
  "label": "Contract End Date",
  "controlType": "Date",
  "conditionalRules": {
    "visibleWhen": "employmentType == 'Contract'",
    "requiredWhen": "employmentType == 'Contract'",
    "disabledWhen": "status == 'Archived'"
  }
}
```

### Supported Operators & Syntax:
* **Comparison:** `==`, `!=`, `>`, `<`, `>=`, `<=`
* **String matching:** `contains`, `startsWith`, `in`
* **Logical:** `&&`, `||`, `!`
* **Engine Execution:** Evaluated safely on the client in real-time (`FormRuleEvaluator`) and re-evaluated authoritatively on the backend (`BusinessRuleEvaluator`) during command execution.

---

## 6. Multi-Dimensional Security & Data Scope Architecture

Enterprise security requires more than binary role permissions (RBAC). UABIndia implements a 5-layer security stack:

```
[Layer 1: Authentication] ─── JWT + Refresh Token Rotation + MFA + IP Whitelist
          │
[Layer 2: RBAC] ───────────── Role -> Permissions (Module.Action, e.g. HRMS.Employee.Create)
          │
[Layer 3: ABAC & Data Scope]  Tenant -> Company -> Project -> Department -> Self
          │
[Layer 4: Row-Level Security] EF Core Global Query Filters (TenantId, CompanyId, DataScope)
          │
[Layer 5: Field-Level Security] Masking & Visibility Rules (Salary, PAN, Bank Details)
```

### Field-Level Security (FLS) Example:
* **HR Executive:** Can view and edit `EmployeeName`, `Department`, `Designation`, `Attendance`. `Salary` and `BankAccount` are masked (`****`).
* **Payroll Admin:** Can view and edit `BasicPay`, `BankDetails`, `PFNumber`, `TaxRegime`.
* **Standard Employee (ESS):** Can only view their own record (`DataScopeLevel.Self`).

---

## 7. Canonical Organizational Hierarchy Model

The platform standardizes the organizational hierarchy across all modules to eliminate structural ambiguity:

```
Platform (UABIndia Multi-Tenant Root)
   │
   └── Tenant (Enterprise Client Instance, e.g. "Acme Corp")
         │
         ├── Company (Legal Entity with distinct PAN/GSTIN/CIN)
         │     │
         │     ├── Business Units (Strategic Business Divisions)
         │     │
         │     ├── Cost Centers & Profit Centers (Financial Allocation Units)
         │     │
         │     └── Projects (Billable & Internal Operational Delivery)
         │
         └── Geographical Organization
               │
               ├── Country (e.g. India - IND)
               │     │
               │     └── Zone (North, South, East, West)
               │           │
               │           └── Region / State (e.g. Maharashtra, Bihar, Karnataka)
               │                 │
               │                 └── District / City (e.g. Mumbai, Patna, Bengaluru)
               │                       │
               │                       └── Physical Location / Branch / Factory
               │                             │
               │                             └── Posting Location / Warehouse Bin
```

---

## 8. Dynamic Navigation Engine

Navigation is entirely metadata-driven and role-scoped rather than hardcoded in the frontend sidebar:

```json
{
  "nodeKey": "hrms.employees",
  "moduleKey": "hrms",
  "menuKey": "talent",
  "title": "Employee Directory",
  "icon": "Users",
  "route": "/hrms/employees",
  "requiredPermission": "HRMS.Employees.View",
  "sortOrder": 10,
  "featureFlag": "HRMS_CORE",
  "isVisible": true
}
```

* **Tenant Overrides:** Individual tenants can reorder menus, rename labels, or hide modules without altering code.
* **Permission Pruning:** The navigation engine automatically filters out menu nodes for which the user lacks authenticated claims.

---

## 9. Page Versioning & Metadata Publishing Governance

To ensure system stability, production metadata is never modified directly in real-time. Changes follow a strict governance workflow:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Draft    │ ──> │ 2. Validate  │ ──> │ 3. Preview   │ ──> │ 4. Approve   │
│ In Studio   │     │ Schema Rules │     │ Test Sandbox │     │ Quality Gate │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                     │
┌─────────────┐     ┌──────────────┐     ┌──────────────┐            │
│ 7. Rollback │ <── │ 6. Archive   │ <── │ 5. Publish   │ <──────────┘
│ Prior Ver.  │     │ Old Version  │     │ To Live Org  │
└─────────────┘     └──────────────┘     └──────────────┘
```

* Every page modification increments `UiPageVersion`.
* If an issue is detected, administrators can rollback to the prior version with 1 click.

---

## 10. Document & Print Template Engine

Enterprise operations require pixel-perfect, branded printable records. UABIndia provides a dedicated Document Template Engine:

* **Supported Output Formats:** HTML (web preview), PDF (download/email), Print (browser dialog), and Excel/CSV (data extracts).
* **Dynamic Variable Interpolation:** `{{Employee.FullName}}`, `{{Company.GSTIN}}`, `{{Salary.NetPayWordings}}`.
* **Statutory Compliance Blocks:** Digital signature placeholder, system-generated verification QR code, and audit watermark.
* **Standard Document Templates:**
  1. Appointment / Offer Letter (`AppointmentLetterModal.tsx`)
  2. Tax Invoice & Quotation (`InvoicesController.cs` & Print trigger)
  3. Purchase Order (`PurchaseOrdersController.cs`)
  4. Monthly Payslip (`PayslipsController.cs`)
  5. Full & Final Settlement Statement (`FinalSettlementController.cs`)
  6. Goods Receipt Note (`GoodsReceiptNotesController.cs`)

---

## 11. Renderer Selection Decision Matrix (Complexity-Driven)

Rather than an arbitrary percentage rule (such as 80/20), UABIndia selects the rendering engine based on the **interaction complexity** of the business domain:

```
                                  Domain Entity Request
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          Interaction Complexity?            │
                     └──────────────────────┬───────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │                                  │                                  │
         ▼                                  ▼                                  ▼
[Standard Catalog CRUD]            [State Progression]                [Specialised Domain]
 • Simple Table/Grid               • Kanban Pipeline                  • Multi-step batch calculations
 • Standard Form Drawer            • Card stage movement              • Financial double-entry grids
 • Filter & Multi-sort             • Stage transition rules           • 2D Role-Permission matrices
 • CSV / Excel Export              • Document drag & drop             • Visual drag-drop layout studio
         │                                  │                                  │
         ▼                                  ▼                                  ▼
   [DynamicPage]                    [DynamicKanban]                    [Dedicated Studio]
(UabTableView + DynamicForm)      (CRM Deals, ATS)            (PayrollWizard, MatrixStudio,
                                                                 MetadataDashboardStudio)
```

---

## 12. Quality Attributes, Technical Precision & Production Roadmap

### 12.1 Exact Technology Versions
* **Frontend:** Next.js `16.x` App Router, React `19.x`, TypeScript `5.x`, TailwindCSS + Vanilla CSS semantic variables, Lucide React, Recharts.
* **Backend:** ASP.NET Core (.NET `10.0`), Entity Framework Core `10.0`, Microsoft SQL Server `2022+`, Hangfire `1.8+`, Serilog, Sentry.

### 12.2 Objective Compliance & Statutory Governance
* **Auditability Objective:** Designed to support comprehensive audit and regulatory controls (capturing old/new serialized JSON deltas, authenticated user ID, IP address, and tenant partition). Formal compliance certifications (SOC 2, ISO 27001) require independent auditor assessment and organizational policy enforcement.
* **Statutory Mathematical Governance:** HRMS and Payroll deduction engines are built against published statutory schedules (EPF Scheme 1952, ESI Act 1948, Payment of Gratuity Act 1972, and Indian Income Tax Act 1961 Section 115BAC).

### 12.3 Implementation & Priority Roadmap

| Priority | Architecture Pillar | Scope & Implementation Deliverables |
|---|---|---|
| **P0 (Current Baseline)** | **Core Engine & Governance** | Clean Architecture solution (8 projects), EF Core 17-schema physical partitioning, multi-tenant global query filters, ABAC Data Scopes, Outbox pattern with exponential backoff, DynamicPage with UabTableView, Unified Approvals Manager, cross-entity Global Search Engine (10 entities), and 328 automated passing tests. |
| **P1 (Near Term)** | **Enterprise Productivity** | Global Search Bar (`Ctrl+K`), Saved Views per user, generic Calendar Engine (Shift rosters & Leaves), dynamic Pivot Engine for finance reports, and automated Data Quality Anomaly Center. |
| **P2 (Advanced SaaS)** | **Field Operations & Ecosystem** | Offline-first PWA sync queue with conflict resolution, White-label Tenant theme customization, Webhook Marketplace, and OpenAPI / Swagger connector SDK. |

---

## 13. Master Architectural Signoff

The UABIndia Enterprise ERP / SaaS Platform establishes a production-grade balance between **rapid metadata-driven extensibility** and **specialized enterprise interaction studios**. By standardizing page engines, field component registries, multi-dimensional security scopes, dynamic rules, and event-driven background processing, the platform is architecturally equipped to scale across hundreds of thousands of concurrent enterprise transactions with complete data integrity.
