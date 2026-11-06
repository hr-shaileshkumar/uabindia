# UabIndia Workspace Page Contract

Every protected page is one of four types. Do not mix them.

## 1. Hub (Module Home)

KPI chips + navigation cards only. No record Create/Delete. Examples: HRMS, Finance, Payroll home.

## 2. List / Register (Default)

Use `StandardPageLayout` or `ModuleTablePage`. Platform / integrations / security lists use the same chrome via `PlatformGlobalPageShell` (adapter over `StandardPageLayout` + `useWorkspaceListView`). Do not invent a second table or form style.

| Zone | What goes here | What does not |
| --- | --- | --- |
| Header left | Short title only | Eyebrow, subtitle, long explanations |
| Header meta | Count / status chips (`WorkspaceHeaderStats`) | Create button, duplicate register heading |
| Header right | Refresh, **Actions** (only after row select), **Columns**, **New** last (`CreateButton`) | Row edit/delete |
| Filter bar | Page search/status if needed, then **Add filter** (column + equals/not equals/like/not like/contains/starts/ends/gt/lt/empty) | New, Save, Delete |
| Content | One white card + `useWorkspaceListView` / `ModuleTablePage` (`workspace-table table-auto`) | Inline create forms, List/New tabs, a second table chrome |
| Columns panel | Right-side checklist of all row/DB fields; table width follows the selected columns | Hard-coded hidden fields with no toggle |
| Last column | `RowActions` (View / Edit / Delete), locked so it stays visible | A second Create button |
| Empty state | Message + the same New action | A different layout |

List registers must use `useWorkspaceListView` (or `ModuleTablePage`, which already wraps it). Row checkboxes enable the header **Actions** menu (Data: Refresh/Export; Bulk changes; Danger: Delete). Column visibility and filter rules persist in `localStorage`. `renderRow` must emit one `<td>` per declared column, in the same order.

Create/Edit/Update: full page inside `#workspace-content` (sidebar + topbar stay). Use `SideDrawer` — it fills the content area, title only, sticky Cancel + Save footer.
Complex masters only (employee): dedicated `/new` or `/[id]` form page with sticky Save/Cancel.  
Delete: confirm dialog (`DeleteConfirmDialog`), never delete in the table cell without confirm.

## 3. Form / Detail

Full-page form. Sticky footer: Cancel + Save. No table on this page.

## 4. Workflow Queue

Approval/rejection list with inline badge statuses.
