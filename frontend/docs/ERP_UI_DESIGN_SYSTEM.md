# ERP Frontend UI Design System (Enterprise)

## Goal
Create **one unified ERP experience** across HRMS, Finance, Operations, Reports, and Admin.

## Core UX Principles
- One platform feel (not separate mini apps)
- Predictable layouts and interactions
- Lightweight visual hierarchy
- Fast scanning for operational users

## Visual Tokens

### Colors
- Background: `#FFFFFF`
- Surface: `#F8FAFC` (light cards/table header)
- Border: `#E2E8F0`
- Text Primary: `#0F172A`
- Text Secondary: `#64748B`
- Active Blue: `#2563EB`
- Success: `#16A34A`
- Warning: `#D97706`
- Danger: `#DC2626`

### Spacing
- Control padding: `px-3 py-2`
- Internal gaps: `gap-2`, `gap-3`, `gap-4`
- Page section spacing: `space-y-6`

### Radius & Shadows
- Radius: `rounded-lg` / `rounded-xl`
- Shadow: minimal (`shadow-sm` only where needed)

### Typography
- Avoid heavy uppercase for content
- Heading:
  - H1: `text-2xl font-bold`
  - H2: `text-lg font-semibold`
- Body: `text-sm`
- Caption: `text-xs text-slate-500`

---

## Global Layout Contract

```text
Topbar (global controls)
Sidebar | Content Area
        | Breadcrumb
        | Page Title + Actions
        | Filters
        | Table/Cards
        | Pagination
```

### Topbar (mandatory)
- Company selector
- Project selector
- Global search
- Notification bell + unread badge
- User profile menu

### Sidebar (mandatory)
- Flat and clean
- Strong active indicator (blue)
- No decorative blocks/cards
- Stable menu grouping:
  - Dashboard
  - HRMS
  - Finance
  - Operations
  - Reports
  - Admin

---

## Standard Page Template
Every protected page must follow:

1. Breadcrumb
2. Title + subtitle
3. Primary actions (Add / Export)
4. Filters row
5. Data section (table/cards)
6. Pagination + result info

### Reference JSX Skeleton
```tsx
<div className="space-y-6">
  <Breadcrumbs />

  <div className="flex items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Page Title</h1>
      <p className="text-sm text-slate-600">Short context</p>
    </div>
    <div className="flex gap-2">
      <button className="rounded-lg border px-3 py-2 text-sm">Export</button>
      <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">Add</button>
    </div>
  </div>

  <section className="rounded-xl border bg-white p-4">
    {/* Filters */}
  </section>

  <section className="rounded-xl border bg-white">
    {/* Table/Cards */}
  </section>

  <section className="flex items-center justify-between text-sm text-slate-600">
    {/* Pagination */}
  </section>
</div>
```

---

## Data Table Pattern
- Header row on light surface
- Search input (left)
- Filter controls (status/date/module/project)
- Bulk action support (future)
- Empty state + loading state + error state

## Form Pattern
- Label above input
- Required marker where needed
- Inline validation message below field
- Sticky save/cancel action row on long forms

## Notification Pattern
- Unread badge in topbar
- List with clear read/unread state
- Quick actions: mark read/open item

## Accessibility Rules
- Minimum touch target 40px
- Keyboard reachable actions
- Focus ring visible
- Text contrast >= WCAG AA

---

## Implementation Rules (Team Contract)
- Pages remain thin (routing + composition)
- Business UI blocks live in `modules/*/components`
- Shared controls in `components/ui` and `components/common`
- Route strings must come from constants file
- Permission strings must come from constants file

## Done Criteria (UI)
- Every protected page follows standard template
- Sidebar style is consistent and minimal
- Topbar controls available globally
- Tables and forms match token set
