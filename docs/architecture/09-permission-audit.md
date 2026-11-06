# 09 — Permission & Role Architecture Audit

## Current Permission Model
The system enforces role-based and permission-based authorization via:
- `User` -> `UserRole` -> `Role` -> `RolePermission` -> `Permission`
- In addition, direct user-level grants exist via `UserPermission` index:
  `("TenantId", "UserId", "Module", "PageKey", "Action")`

## Identified Deficiencies & Recommendations
1. **Hardcoded Role Names in UI**:
   - Some legacy components check `user.role === 'SuperAdmin'` or `user.role === 'Admin'`.
   - **Recommendation**: Replace all UI role checks with resource-action permissions: `hasPermission('hrms.employees.export')`.
2. **Backend Action Authorization**:
   - Controllers currently use `[Authorize]` or `[Authorize(Roles = "Admin,HR")]`.
   - **Recommendation**: Standardize on permission-based policy attributes:
     ```csharp
     [HasPermission(Permissions.Hrms.Employees.Read)]
     [HttpGet]
     public async Task<IActionResult> GetEmployees(...)
     ```
3. **Tenant-Level Role Isolation**:
   - Verify that custom roles created by Tenant A are strictly scoped to `TenantId` and never visible to Tenant B. Global system roles (`SuperAdmin`, `TenantAdmin`) must be marked `IsSystemRole = true`.
