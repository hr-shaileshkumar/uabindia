# Admin UI Interaction Architecture (ERP/HRMS)

## Standard interaction model

For all admin modules, use this consistent pattern:

1. **List Page**
   - Table/grid + search + filters + KPI summary cards
2. **Create**
   - Full-page form card (tab/form section in page body)
3. **Quick Edit / Rename**
   - Right-side drawer (fast, minimal fields)
4. **Delete**
   - Confirmation modal (danger variant)
5. **View Details**
   - Profile/detail card below table or side panel

## Where each pattern is best

- **Full-page create form**: entities with many fields and validation (Users, Companies, ERP masters)
- **Quick edit drawer**: high-frequency changes (rename, status, category, role, short metadata)
- **Confirmation modal**: delete, permanent delete, critical actions
- **Profile card**: read-only snapshot for selected row (email/status/roles/tenant, code/city/owner)

## Shared building blocks in this repo

- `frontend/src/components/ui/useConfirmDialog.tsx`
  - Standard confirmation modal for delete/critical actions
- `frontend/src/components/ui/QuickEditDrawer.tsx`
  - Standard quick-edit drawer shell
- `frontend/src/components/ui/EntityProfileCard.tsx`
  - Standard profile/details card
- `frontend/src/features/shared/components/ModuleTablePage.tsx`
  - Shared table page with support for:
    - `kpiCards`
    - `detailCard`
    - `quickEditDrawer`

## Implemented examples

### 1) Users (`frontend/src/app/(protected)/platform/users/page.tsx`)
- Create: full-page form tab
- Quick edit: drawer
- Delete: confirmation modal
- View: profile card

### 2) Companies (`frontend/src/app/(protected)/platform/companies/page.tsx`)
- Create: full-page tabbed form (general/address/banking/contacts)
- Quick edit: drawer
- Delete: confirmation modal
- View: profile card

## Rollout guidance for remaining modules

For each CRUD page:

1. Keep list table/search/filter as primary tab
2. Move create form to full-page tab/card (if not already)
3. Add `QuickEditDrawer` for 3–6 most-used editable fields
4. Keep delete on `useConfirmDialog` (danger confirm)
5. Add `EntityProfileCard` for selected row details

This gives consistent UX across Platform, HRMS, Payroll, ERP/Finance, Security, Licensing.
