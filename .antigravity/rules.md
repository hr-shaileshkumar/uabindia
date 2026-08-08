# ERP UI & CSS Design System Standards

- **Design System:** Utility-first CSS (Tailwind CSS v4) with CSS custom properties (`var(--bg-app)`, `var(--bg-surface)`, `var(--border-subtle)`, `var(--text-main)`, `var(--text-muted)`, `var(--primary)`).
- **Theme Support:** Native Dark/Light mode support via `next-themes` with class (`.dark`) or dataset attributes.
- **ERP Components:** All data tables, badges, status indicators, KPI metric cards, and form grids MUST use centralized UI primitives from `@/components/ui/`.
- **Layout Architecture:** Strict App Shell pattern (`Sidebar`, `Header`, `Breadcrumb`, `MainContentContainer` via `@/components/layout/AppShell`).
- **Data Density:** High-density enterprise layout (compact spacing, clear visual hierarchy, WCAG AA accessible color contrast).
