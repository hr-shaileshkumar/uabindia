# ERP SaaS Platform Design Token System

This document outlines the centralized design token system, CSS variable dictionary, semantic color tokens, component primitives, and layout standards for the UABIndia ERP SaaS Platform.

---

## 1. Core Semantic CSS Variables

All components and page layouts MUST consume these semantic tokens instead of hardcoded hex values or generic Tailwind color utilities.

### Light & Dark Theme Variable Dictionary

| CSS Variable | Light Mode | Dark Mode | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#f8fafc` (Slate 50) | `#090d16` (Deep Midnight) | Global Application Background |
| `--bg-surface` | `#ffffff` (White) | `#0f172a` (Slate 900) | Surface Cards, Panels, Drawers |
| `--bg-surface-hover` | `#f1f5f9` (Slate 100) | `#1e293b` (Slate 800) | Interactive Row/Item Hover |
| `--bg-muted` | `#f1f5f9` (Slate 100) | `#1e293b` (Slate 800) | Muted background fills |
| `--border-subtle` | `#e2e8f0` (Slate 200) | `#1e293b` (Slate 800) | Component Borders, Table Dividers |
| `--border-strong` | `#cbd5e1` (Slate 300) | `#334155` (Slate 700) | Input Focus Borders, Card Outlines |
| `--text-main` | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50) | Primary Headings & Body Text |
| `--text-muted` | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) | Subtitles, Labels, Captions |
| `--text-subtle` | `#94a3b8` (Slate 400) | `#64748b` (Slate 500) | Disabled & Placeholder Text |
| `--primary` | `#4f46e5` (Indigo 600) | `#6366f1` (Indigo 500) | Primary Brand Accent |
| `--primary-hover` | `#4338ca` (Indigo 700) | `#4f46e5` (Indigo 600) | Primary Button Hover |
| `--primary-subtle` | `#eef2ff` (Indigo 50) | `rgba(99,102,241,0.15)` | Primary Light Tint / Focus Rings |
| `--success` | `#16a34a` (Green 600) | `#22c55e` (Green 500) | Positive Metrics, Active Status |
| `--success-bg` | `#f0fdf4` (Green 50) | `rgba(34,197,94,0.15)` | Success Badge & Alert Fills |
| `--warning` | `#d97706` (Amber 600) | `#f59e0b` (Amber 500) | Pending Status, Warning Alerts |
| `--warning-bg` | `#fffbeb` (Amber 50) | `rgba(245,158,11,0.15)` | Warning Badge & Alert Fills |
| `--danger` | `#dc2626` (Red 600) | `#ef4444` (Red 500) | Failed Status, Error Alerts |
| `--danger-bg` | `#fef2f2` (Red 50) | `rgba(239,68,68,0.15)` | Danger Badge & Alert Fills |
| `--info` | `#2563eb` (Blue 600) | `#3b82f6` (Blue 500) | Information Badges & Highlights |
| `--info-bg` | `#eff6ff` (Blue 50) | `rgba(59,130,246,0.15)` | Info Fills |

---

## 2. Spacing & Density Tokens

Enterprise data-dense layouts require consistent radii, spacing, and elevation.

- **Border Radii:**
  - Control Radius: `--radius-sm` (`0.375rem` / 6px)
  - Card/Panel Radius: `--radius-md` (`0.625rem` / 10px)
  - Modal/Sheet Radius: `--radius-lg` (`0.75rem` / 12px)
- **Elevation Shadows:**
  - Subtle: `--shadow-sm` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`)
  - Elevated: `--shadow-md` (`0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`)
  - Overlay: `--shadow-lg` (`0 10px 15px -3px rgba(0, 0, 0, 0.1)`)

---

## 3. UI Primitive Component Standards

Authenticated pages use these current primitives:

1. **`DataTable`** (`@/components/ui/data-table.tsx`): Sticky header, pagination, search, column sorting, and skeleton loaders.
2. **KPI chips** (`erpStatCardClassName` in `@/components/erp/erpStyles.ts`): Metric cards for hub pages — title, value, and helper text.
3. **`StatusBadge`** (`@/components/erp/status-badge.tsx` or `@/components/ui/status-badge.tsx`): Status pills for Active, Pending, Failed, Draft, Completed, and similar states.
4. **`ERPFormGrid`** (`@/components/ui/erp-form-grid.tsx`): Responsive 2-column or 3-column form layout.

---

## 4. App Shell & Page Structure

The authenticated chrome lives in `frontend/src/app/(protected)/layout.tsx`: sidebar (`Sidebar`) + topbar (`Header`) + Ctrl+K search (`GlobalSearchCommand`).

Page content uses `StandardPageLayout`:

```tsx
<StandardPageLayout
  title="Vendor Management"
  icon="building"
  actions={<ErpCreateButton label="New" onClick={openCreate} />}
>
  {/* Table or hub content */}
</StandardPageLayout>
```
