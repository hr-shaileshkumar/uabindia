# ERP System Duplicate & Code Cleanup - IMPLEMENTATION GUIDE

## Quick Reference: Priority Matrix

```
          Effort
         Low  Medium  High
Impact
High      🔴   🔴    🔴
         [3]   [1]   [2]

Medium    🟡   🟡    🟡
         [6]   [4]   [5]

Low       🟢   🟢    🟢
         [8]   [7]   [9]
```

**Do in order: 🔴 → 🟡 → 🟢**

---

## 🔴 CRITICAL PRIORITY (Do First - Today)

### [P1.1] CRITICAL: Resolve WorkflowController Conflict

**Location:** `Backend/src/UabIndia.Api/Controllers/`

**Problem:** Two controllers, same routes, will cause runtime errors

**Step-by-step:**

**Step 1: Identify which controller is in use**

```powershell
# In Backend folder
# Search for WorkflowController references
grep -r "WorkflowController" --include="*.cs" .

# Search for WorkflowsController references  
grep -r "WorkflowsController" --include="*.cs" .

# Check Program.cs for explicit route registration
grep -A5 "WorkflowController\|WorkflowsController" Program.cs

# Check appsettings for which controller is configured
grep -i "workflow" appsettings.json
```

**Step 2: Open both files side-by-side**
- `WorkflowController.cs` - has 501 "Not Implemented" stubs
- `WorkflowsController.cs` - check if complete

**Step 3: Decision matrix**

| WorkflowsController has all endpoints? | Action |
|----------------------------------------|--------|
| YES | Delete WorkflowController.cs |
| NO | Merge all implemented endpoints into WorkflowsController |
| PARTIAL | Cherry-pick working endpoints |

**Step 4: Merge incomplete endpoints**

If `WorkflowsController.cs` is missing endpoints from `WorkflowController.cs`:

```csharp
// DON'T copy 501 stubs!
// Only copy:
// - Complete implementations
// - Endpoints with actual logic
// - Remove all "Not Implemented" returns
```

**Step 5: Verify and delete**

```powershell
# After merge, ensure no duplicate routes in final controller
# Look for @Route or [Route] attributes pointing to same paths

# Test locally
dotnet run
# Verify no ambiguous route errors

# Finally delete old file
rm Backend/src/UabIndia.Api/Controllers/WorkflowController.cs
```

**Verification:**
- [ ] Program.cs has only ONE workflow controller
- [ ] No 501 responses in workflows API
- [ ] Test: `curl http://localhost:5000/api/v1/workflows`
- [ ] No ambiguous route exceptions in logs

**Effort:** 45 min | **Impact:** Fixes production API

---

### [P1.2] CRITICAL: Remove Empty Implementations

**Location:** `Backend/src/UabIndia.Api/Controllers/WorkflowController.cs` (before deletion)

**Problem:** 3 endpoints return 501 "Not Implemented"

**Decision:** For each endpoint, decide:
```
Option A: Fully implement (development task - can take days)
Option B: Remove entirely (if not needed yet)
Option C: Mark as feature-flagged/future (if coming soon)
```

**Find the stubs:**
```powershell
grep -n "501\|Not Implemented" Backend/src/UabIndia.Api/Controllers/WorkflowController.cs
```

**Action per endpoint:**
```
Endpoint: CreateDefinition (Line 30)
- Do we need this? Check requirements
- Move to backlog if not ready
- Delete if not needed
- Implement if critical

Endpoint: GetDefinition (Line 37)
- Same logic

Endpoint: GetApprovals (Line 122)
- Same logic
```

**Effort:** 15 min | **Impact:** Cleaner API contract

---

## 🔴 HIGH PRIORITY (This Week)

### [P2.1] Consolidate Request Logging Middleware

**Location:** `Backend/src/UabIndia.Api/Middleware/`

**Files:**
- `RequestLoggingMiddleware.cs`
- `RequestResponseLoggingMiddleware.cs`

**Step 1: Check which is registered**

```powershell
# Open Program.cs
grep -n "RequestLogging\|RequestResponseLogging" Backend/src/UabIndia.Api/Program.cs
```

**Step 2: Understand the difference**

```csharp
// Compare:
// - RequestLoggingMiddleware: Logs incoming requests only
// - RequestResponseLoggingMiddleware: Logs requests AND responses

// Keep the more comprehensive one (RequestResponseLoggingMiddleware)
```

**Step 3: Delete the simpler one**

```powershell
rm Backend/src/UabIndia.Api/Middleware/RequestLoggingMiddleware.cs
```

**Step 4: Verify Program.cs uses the kept one**

```csharp
// In Program.cs, ensure only this line exists:
app.UseMiddleware<RequestResponseLoggingMiddleware>();

// NOT both:
// app.UseMiddleware<RequestLoggingMiddleware>();
// app.UseMiddleware<RequestResponseLoggingMiddleware>();
```

**Verification:**
- [ ] Only one logging middleware in Program.cs
- [ ] Application.UseMiddleware<T> called once for logging
- [ ] Test: `dotnet run` - no duplicate logging in output

**Effort:** 20 min

---

### [P2.2] Fix Repository Location Inconsistency

**Location:** `Backend/src/UabIndia.Infrastructure/`

**Current state:**
```
WRONG:  Data/AppraisalRepository.cs
RIGHT:  Repositories/AppraisalRepository.cs

WRONG:  Data/RefreshTokenRepository.cs  
RIGHT:  Repositories/RefreshTokenRepository.cs
```

**Step 1: Move files**

```powershell
# Option 1: Via VS or folder
# - Cut AppraisalRepository.cs from Infrastructure/Data/
# - Paste to Infrastructure/Repositories/
# - Same for RefreshTokenRepository.cs

# Option 2: Via command line
mv Backend/src/UabIndia.Infrastructure/Data/AppraisalRepository.cs `
   Backend/src/UabIndia.Infrastructure/Repositories/AppraisalRepository.cs

mv Backend/src/UabIndia.Infrastructure/Data/RefreshTokenRepository.cs `
   Backend/src/UabIndia.Infrastructure/Repositories/RefreshTokenRepository.cs
```

**Step 2: Find and update using statements**

```powershell
# Find files that import these
grep -r "using.*AppraisalRepository\|using.*RefreshTokenRepository" --include="*.cs" .

# Update any files that reference old namespace
```

**Example fixes:**
```csharp
// BEFORE:
using UabIndia.Infrastructure.Data;

// AFTER:
using UabIndia.Infrastructure.Repositories;
```

**Step 3: Verify DI registration**

```csharp
// In Program.cs, find where these repositories are registered
grep -A2 "AppraisalRepository\|RefreshTokenRepository" Backend/src/UabIndia.Api/Program.cs

// Should look like:
services.AddScoped<IAppraisalRepository, AppraisalRepository>();
services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

// No changes needed if these are already correct
```

**Verification:**
- [ ] Files moved to correct location
- [ ] All using statements updated
- [ ] Project compiles: `dotnet build`
- [ ] DI registration still works (no runtime errors)

**Effort:** 20 min

---

### [P2.3] Remove Temporary Build Directories

**Location:** `Backend/src/`

**Problem:** `_temp_build/` and `_temp_build2/` shouldn't be in source

**Step 1: Remove from filesystem**

```powershell
# In Backend/src folder
rm -Recurse _temp_build
rm -Recurse _temp_build2
```

**Step 2: Remove from git history**

```powershell
# From project root
git rm -r Backend/src/_temp_build Backend/src/_temp_build2

# Commit the removal
git commit -m "Remove temporary build artifacts"
```

**Step 3: Prevent future commits**

```powershell
# Edit .gitignore (create if doesn't exist)
# Add these lines:
_temp_build/
_temp_build2/
_temp_*/
obj/
bin/
```

**Verification:**
- [ ] Directories deleted locally
- [ ] `git status` shows them as removed/deleted
- [ ] .gitignore updated

**Effort:** 5 min

---

## 🟡 MEDIUM PRIORITY (Next Week)

### [P3.1] Consolidate Frontend API Hooks

**Location:** `frontend/src/lib/`

**Files:**
- `api-hooks-part1.ts` (14,874 bytes)
- `api-hooks-part2.ts` (12,625 bytes)

**Background:** These files contain React hooks for API calls

**Step 1: Create new consolidated file**

```typescript
// frontend/src/lib/api-hooks.ts
'use client';

import { useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

// =====================================
// PERFORMANCE & APPRAISAL HOOKS
// =====================================
export const usePerformanceAppraisals = () => {
  // ... copy from api-hooks-part1.ts
};

// =====================================
// LEAVE MANAGEMENT HOOKS
// =====================================
export const useLeaveRequests = () => {
  // ... copy from api-hooks-part1.ts
};

// ... continue with all other hooks organized by feature

// Export everything for backwards compatibility
export * from './api-hooks-part1';
export * from './api-hooks-part2';
```

**Step 2: Organize by functionality**

Structure your hooks logically:
```typescript
// Performance & Appraisals
// Leave Management  
// Attendance Tracking
// Asset Management
// Document Management
// Workflow Automation
// Common utilities
```

**Step 3: Update all imports**

Find all files importing from split files:
```powershell
grep -r "from.*api-hooks-part" --include="*.ts" --include="*.tsx" frontend/src/

# Should return list of files to update
```

For each file:
```typescript
// BEFORE:
import { usePerformanceAppraisals } from '@/lib/api-hooks-part1';
import { useAssets } from '@/lib/api-hooks-part2';

// AFTER:
import { usePerformanceAppraisals, useAssets } from '@/lib/api-hooks';
```

**Step 4: Verify and delete**

```powershell
# Test build
npm run build

# If successful, delete old files
rm frontend/src/lib/api-hooks-part1.ts
rm frontend/src/lib/api-hooks-part2.ts
```

**Verification:**
- [ ] New api-hooks.ts created
- [ ] All hooks moved from both files
- [ ] All imports updated
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors in IDE
- [ ] Old files deleted

**Effort:** 1 hour

---

### [P3.2] Consolidate Frontend Route Definitions

**Location:** `frontend/src/`

**Files:**
- `constants/routes.ts` (main) - 75 routes
- `modules/hrms/attendance/routes.ts` (3 routes) - TO REMOVE
- `modules/hrms/leave/routes.ts` (3 routes) - TO REMOVE
- `modules/hrms/recruitment/routes.ts` (3 routes) - TO REMOVE

**Current structure:**
```typescript
// constants/routes.ts
export const ROUTES = {
  ATTENDANCE: "/erp/hrms/attendance",
  LEAVE: "/erp/hrms/leave",
  // ... etc
};
```

**Step 1: Expand ROUTES object with sub-routes**

```typescript
// constants/routes.ts
export const ROUTES = {
  // ... existing routes ...

  HRMS_ROUTES: {
    ATTENDANCE: {
      HOME: "/erp/hrms/attendance",
      DAILY: "/erp/hrms/attendance/daily",
      MONTHLY: "/erp/hrms/attendance/monthly",
      CORRECTION: "/erp/hrms/attendance/correction",
    },
    LEAVE: {
      HOME: "/erp/hrms/leave",
      APPLY: "/erp/hrms/leave/apply",
      APPROVAL: "/erp/hrms/leave/approval",
      BALANCE: "/erp/hrms/leave/balance",
    },
    RECRUITMENT: {
      HOME: "/erp/hrms/recruitment",
      CANDIDATES: "/erp/hrms/recruitment/candidates",
      INTERVIEWS: "/erp/hrms/recruitment/interviews",
      OFFER: "/erp/hrms/recruitment/offer",
    },
  },
} as const;
```

**Step 2: Update imports in modules**

Find usage:
```powershell
grep -r "from.*attendance/routes\|from.*leave/routes\|from.*recruitment/routes" --include="*.ts" --include="*.tsx" frontend/src/
```

Update each:
```typescript
// BEFORE:
import { attendanceRoutes } from '../routes';

// AFTER:
import { ROUTES } from '@/constants/routes';
const attendanceRoutes = ROUTES.HRMS_ROUTES.ATTENDANCE;
```

**Step 3: Delete module route files**

```powershell
rm frontend/src/modules/hrms/attendance/routes.ts
rm frontend/src/modules/hrms/leave/routes.ts
rm frontend/src/modules/hrms/recruitment/routes.ts
```

**Verification:**
- [ ] HRMS_ROUTES object added to constants/routes.ts
- [ ] All module imports updated
- [ ] Module route files deleted
- [ ] `npm run build` succeeds
- [ ] Navigation still works (test in browser)

**Effort:** 45 min

---

### [P3.3] Complete or Backlog TODO Tasks

**Location:** `Backend/src/UabIndia.Infrastructure/Services/HangfireJobService.cs`

**Issues:**
- 4 TODO comments to implement
- These are background jobs that are not yet functional

**Action for each TODO:**

```csharp
// TODO 1 (Line 33): Implement payroll calculation logic
public void SchedulePayrollCalculation() 
{
    RecurringJob.AddOrUpdate(
        "payroll-calculation",
        () => // ??? NOT IMPLEMENTED ???
        Cron.Monthly(1, 0) // First of month
    );
}
```

**Decision tree:**
```
Is this feature required for v1 release?
├─ YES → Implement now (estimate hours needed)
├─ NO  → Move to backlog
└─ MAYBE → Add feature flag for now
```

**Step 1: For each TODO, document**

```markdown
## Payroll Calculation Job

**Status:** 🔴 TODO  
**Priority:** P2  
**Effort:** 4 hours (estimate)  
**Dependency:** Payroll module completed

**Implementation:**
- [ ] Create PayrollCalculationService
- [ ] Add business logic for payroll runs
- [ ] Update HangfireJobService to call it
- [ ] Add unit tests
- [ ] Add integration tests
```

**Step 2: Choose approach**

### Option A: Implement Now
```csharp
public void SchedulePayrollCalculation() 
{
    RecurringJob.AddOrUpdate(
        "payroll-calculation",
        () => _payrollService.CalculateMonthlyPayroll(),
        Cron.Monthly(1, 0)
    );
}
```

### Option B: Disable Until Ready
```csharp
public void SchedulePayrollCalculation() 
{
    // TODO: Implement payroll calculation logic
    // Feature scheduled for v2.0 release
    // Tracked in: ISSUE #1234
    
    // Temporarily disabled
    // RecurringJob.AddOrUpdate(
    //     "payroll-calculation",
    //     () => { /* ... */ },
    //     Cron.Monthly(1, 0)
    // );
}
```

**Step 3: Repeat for all 4 TODOs**

1. SchedulePayrollCalculation (Line 33)
2. ScheduleLeaveExpiry (Line 60)
3. ScheduleAuditLogArchival (Line 86)
4. ScheduleCleanup (Line 166)

**Verification:**
- [ ] Each TODO has decision (implement/disable/backlog)
- [ ] Code compiles
- [ ] Application starts without errors
- [ ] Hangfire dashboard shows which jobs are active

**Effort:** 1-2 hours (depends on implementation vs disable)

---

### [P3.4] Delete Empty Test Files

**Location:** `Backend/tests/`

**Issue:** Placeholder test file with no implementation

```csharp
[TestClass]
public class UnitTest1
{
    // Empty - no tests
}
```

**Action:**

```powershell
# Find empty test files
grep -l "^[[:space:]]*$" Backend/tests/**/*.cs | grep -i "unittest\|placeholder"

# Delete
rm Backend/tests/UnitTest1.cs

# Or if using IDE:
# Right-click file → Delete
```

**Verification:**
- [ ] Placeholder files deleted
- [ ] `dotnet test` runs successfully

**Effort:** 5 min

---

## 🟢 LOW PRIORITY (Polish)

### [P4.1] Centralize Configuration

**Location:** `Backend/src/UabIndia.Api/`

**Issue:** Same settings configured in multiple places:
- CORS policies in Program.cs AND PolicyContext.cs
- JWT config in Program.cs AND JwtService.cs
- Encryption in Program.cs AND AesEncryptionService.cs

**Approach:**

**Single source of truth:**
```csharp
// Program.cs - All configuration in ONE place
var jwtSettings = builder.Configuration.GetSection("Jwt");
var policySettings = builder.Configuration.GetSection("Policies");
var encryptionSettings = builder.Configuration.GetSection("Encryption");

// Services read from these
services.Configure<JwtSettings>(jwtSettings);
services.Configure<PolicySettings>(policySettings);
services.Configure<EncryptionSettings>(encryptionSettings);
```

**Then services use DI:**
```csharp
public class JwtService
{
    private readonly IOptions<JwtSettings> _options;
    
    public JwtService(IOptions<JwtSettings> options)
    {
        _options = options; // No explicit config validation needed
    }
}
```

**Effort:** 1 hour

---

## ✅ VERIFICATION CHECKLIST

Before considering cleanup complete:

```
BACKEND VERIFICATION
☐ No ambiguous route errors on startup
☐ All API endpoints return < 501 status
☐ No duplicate controller registrations
☐ All repositories in Infrastructure/Repositories/
☐ Only one logging middleware active
☐ HangfireJob service doesn't expose incomplete features
☐ Application code has < 5 TODO comments
☐ No _temp_build directories in source
☐ `dotnet build` completes without warnings
☐ `dotnet run` starts successfully

FRONTEND VERIFICATION
☐ Single api-hooks.ts file exists
☐ Part1 and Part2 files deleted
☐ All hooks properly imported
☐ routes.ts consolidation complete
☐ No module routes.ts files remain
☐ Sidebar.ts files cross-checked (no dupes)
☐ `npm run build` completes
☐ No TypeScript errors in IDE
☐ App builds to production
☐ Navigation still works end-to-end

GENERAL VERIFICATION
☐ All changes committed to git
☐ .gitignore updated with temp dirs
☐ No secrets exposed in changes
☐ Code review completed
☐ Test suite passes
☐ CI/CD pipeline passes
```

---

## SUMMARY TIMELINE

| Phase | Items | Time | Deadline |
|-------|-------|------|----------|
| 🔴 CRITICAL | 2 tasks | 1 hour | TODAY |
| 🔴 HIGH | 3 tasks | 1 hour | THIS WEEK |
| 🟡 MEDIUM | 4 tasks | 4 hours | NEXT WEEK |
| 🟢 LOW | 1 task | 1 hour | OPTIONAL |
| **TOTAL** | **10 tasks** | **7 hours** | **2 weeks** |

---

## ROLLBACK PLAN

If any change breaks something:

```powershell
# Unstage changes
git reset HEAD~1

# Or revert specific commits
git revert <commit-hash>

# Or restore from backup branch
git checkout backup-branch -- path/to/file
```

**Prevention:** Create branch before starting
```powershell
git checkout -b cleanup/consolidate-duplicates
# Do all work on this branch
# Create PR for review before merging to main
```

---

**Last updated:** 2025-02-20  
**Prepared by:** Code Audit System  
**Status:** Ready for Implementation
