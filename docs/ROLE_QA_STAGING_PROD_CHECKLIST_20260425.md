# Role QA + Staging/Production Checklist (2026-04-25)

## Scope
This checklist is for safe rollout of RBAC stabilization while the root repo contains unrelated pre-existing modified/deleted files.

---

## 1) Preflight Safety (must pass before QA)

| Check | Command / Action | Expected | Status |
|---|---|---|---|
| Branch | `git -C c:\Users\hp\Desktop\ERP branch --show-current` | `release/stable-frontend` | ☐ |
| Backend build | `dotnet build UabIndia.sln --nologo -clp:ErrorsOnly` | No errors output | ☐ |
| Frontend build | `npm --prefix frontend run build` | Build completes successfully | ☐ |
| Archive check | Verify `archive/frontend-next/` exists | Folder present | ☐ |
| Cleanup script exists | Verify `Backend/migrations_scripts/role_cleanup_standardize_20260425.sql` | File present | ☐ |

> Safety rule: do **not** run broad `git add .` in this repository state. Use explicit pathspecs only.

---

## 2) Manual Role-Based QA Matrix (strict pass/fail)

### Test accounts
- SuperAdmin
- Admin
- Employee
- Unauthorized (valid login, no required module permission)

### Routes under test
- `/dashboard`
- `/hrms`
- `/hrms/employees`
- `/hrms/payroll`
- `/hrms/attendance`
- `/reports`
- `/notifications`
- `/documents`
- `/platform/roles`
- `/platform/permissions`

### Matrix

| Role \ Route | Dashboard | HRMS | Employees | Payroll | Attendance | Reports | Notifications | Documents | Platform Roles | Platform Permissions |
|---|---|---|---|---|---|---|---|---|---|---|
| SuperAdmin | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F |
| Admin | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F |
| Employee | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F |
| Unauthorized | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F | ☐ P / ☐ F |

Legend:
- Pass criteria for allowed route: page loads, no runtime 403/404 loop, no forced logout.
- Pass criteria for denied route: redirect to `/not-authorized` (or explicit denial view), app remains stable.

---

## 3) Failure → Fix Point Mapping

| Symptom | Likely Layer | First Fix Point |
|---|---|---|
| 404 on role permissions (`/roles/{id}/permissions`) | API route mismatch | `Backend/src/UabIndia.Api/Controllers/RolesController.cs` |
| 403 on module load for SuperAdmin | Policy/middleware role normalization | `PolicyEnforcementMiddleware`, `OrgScopeMiddleware`, `AuthController.Permissions()` |
| Platform page crashes on AxiosError | Frontend error handling | `frontend/src/services/hrApi.ts`, page-level `try/catch` and error UI |
| Employee sees admin pages | Permission assignment/seed mismatch | `PolicySeeder`, role-permission assignments, DB role cleanup script |
| User redirected to login unexpectedly | auth refresh/cookie or tenant scope headers | `frontend/src/services/apiClient.ts`, backend auth endpoints |

---

## 4) Execute DB Role Cleanup in Staging

> Run in **staging only** first.

1. Backup staging DB.
2. Execute:
   - `Backend/migrations_scripts/role_cleanup_standardize_20260425.sql`
3. Post-run verification queries:

```sql
-- role name distribution after cleanup
SELECT Name, COUNT(*) AS Cnt
FROM Roles
WHERE IsDeleted = 0
GROUP BY Name
ORDER BY Name;

-- users mapped to canonical admin/superadmin roles
SELECT r.Name, COUNT(*) AS UsersCount
FROM UserRoles ur
JOIN Roles r ON ur.RoleId = r.Id
WHERE ur.IsDeleted = 0 AND r.IsDeleted = 0
GROUP BY r.Name
ORDER BY r.Name;
```

4. Record results in release notes.

Go/No-Go:
- Go only if canonical role names are present and no expected admin users lose role assignment.

---

## 5) Staging Deploy Checklist

| Step | Expected | Status |
|---|---|---|
| Deploy backend + frontend to staging | Services healthy | ☐ |
| Smoke `/auth/me` and `/auth/permissions` | 200 + expected role mode | ☐ |
| Run full role matrix above | No blocker failures | ☐ |
| Verify platform admin pages (`roles`, `permissions`) | No 404/500 | ☐ |
| Verify notifications/documents access by role | Correct allow/deny | ☐ |

If any blocker fails: stop promotion, map using section 3, patch, rebuild, redeploy staging.

---

## 6) Production Deploy Checklist

Promote only if staging matrix is fully green.

| Step | Expected | Status |
|---|---|---|
| Freeze window confirmed | Change window active | ☐ |
| Production backup complete | Verified restore point | ☐ |
| Deploy backend then frontend | Healthy startup | ☐ |
| Quick role sanity (SuperAdmin/Admin/Employee) | No critical regression | ☐ |
| Monitor errors/logins for 30 min | No spike in 401/403/404 | ☐ |

Rollback trigger examples:
- Widespread 403 for previously allowed admin flows
- Any login/refresh token outage
- Persistent 404 on core admin APIs

---

## 7) Notes Capture

- Staging deploy time:
- Production deploy time:
- Script execution operator:
- Matrix owner:
- Known exceptions (if any):
