# 13 — Frontend Dynamic Renderer Architecture

## Framework Evaluation: Next.js 15/16 vs React 19

### Architectural Recommendation
- **React 19**: Adopt as the foundational UI runtime. React 19 introduces native **Server Actions**, **`useActionState`**, **`useOptimistic`**, and the **React Compiler**, eliminating unnecessary re-renders in heavy ERP data tables.
- **Next.js 15.1+ App Router**: Adopt as the enterprise application framework. Next.js 15 brings asynchronous request APIs (`cookies()`, `headers()`), enhanced server component caching control, and high-performance Turbopack builds.
- *(Note on Next.js 20: Next.js is currently at major version 15, with 16 on canary roadmap; references to Next.js 20 denote future Node.js LTS 20/22 runtime compatibility).*

## Component Design System

### 1. `<DynamicPage />`
Container component responsible for:
- Fetching page schema from `usePageSchema(pageKey)`.
- Fetching tabular dataset using standard pagination params.
- Coordinating search, filtering, drawer state, and CSV/Excel export.
- Displaying KPI scorecard widgets.

### 2. `<DynamicTable />`
Data grid rendering engine:
- Supports string, currency, date, datetime, badge, link, and action columns.
- Dynamic column resizing, reordering, and visibility toggling.
- Row-level action menus (Edit, View Details, Delete, Workflow Trigger).
- Multi-row selection with batch action toolbar.

### 3. `<DynamicForm />`
Schema-driven form engine:
- Translates field definitions into multi-column responsive grid layout.
- Integrates with React Hook Form + Zod for client-side validation.
- Supports 18 core field types:
  `Text`, `Number`, `Currency`, `Date`, `DateTime`, `Boolean`, `Select`, `MultiSelect`, `Lookup`, `Autocomplete`, `Textarea`, `File`, `Image`, `Password`, `Phone`, `Email`, `RichText`, `Relation`.
