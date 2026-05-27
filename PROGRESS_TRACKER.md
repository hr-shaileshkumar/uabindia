# 📊 ERP Code Cleanup - Progress Tracker

**Start Date:** ________________  
**Target Completion:** ________________  

---

## 🔴 CRITICAL PHASE (Do Today)

### [P1.1] Resolve WorkflowController Conflict

```
Task: Identify and merge/delete duplicate workflow controllers
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Search for WorkflowController usage across codebase
  ☐ Search for WorkflowsController usage across codebase
  ☐ Check Program.cs for controller registration
  ☐ Compare implementations to identify which is primary
  ☐ Merge any unique endpoints from secondary into primary
  ☐ Delete duplicate endpoints (501 stubs)
  ☐ Delete duplicate controller file
  ☐ Update Program.cs if needed
  ☐ Compile and verify: dotnet build ✓
  ☐ Test locally: dotnet run ✓
  ☐ Verify no ambiguous route exceptions

Time Estimated: 45 min
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

### [P1.2] Remove Empty/Dead Endpoints

```
Task: Remove or implement 501 "Not Implemented" endpoints
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Find all 501 status code returns: grep -r "501" Backend/src/
  ☐ Identify: CreateDefinition endpoint (Line 30)
  ☐ Decide: Implement, remove, or move to backlog
  ☐ Identify: GetDefinition endpoint (Line 37)
  ☐ Decide: Implement, remove, or move to backlog
  ☐ Identify: GetApprovals endpoint (Line 122)
  ☐ Decide: Implement, remove, or move to backlog
  ☐ Document backlog items in issue tracker
  ☐ Compile and verify: dotnet build ✓
  ☐ Test API response codes

Time Estimated: 30 min
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
Notes: 
  - DeleteDefinition: ☐ Impl ☐ Remove ☐ Backlog
  - GetDefinition: ☐ Impl ☐ Remove ☐ Backlog
  - GetApprovals: ☐ Impl ☐ Remove ☐ Backlog
```

---

## 🟡 HIGH PRIORITY PHASE (This Week)

### [P2.1] Consolidate Logging Middleware

```
Task: Remove duplicate logging middleware
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Compare RequestLoggingMiddleware.cs vs RequestResponseLoggingMiddleware.cs
  ☐ Determine which is more comprehensive
  ☐ Check Program.cs for middleware registration pattern
  ☐ Verify only one is needed
  ☐ Delete the simpler middleware file
  ☐ Ensure Program.cs has only ONE middleware registration
  ☐ Compile and verify: dotnet build ✓
  ☐ Test logging output

Middleware to keep: _______________________
Middleware to delete: _______________________
Time Estimated: 20 min
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

### [P2.2] Fix Repository Locations

```
Task: Move AppraisalRepository and RefreshTokenRepository to correct folder
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Move AppraisalRepository.cs: 
    From: Backend/src/UabIndia.Infrastructure/Data/
    To:   Backend/src/UabIndia.Infrastructure/Repositories/
  
  ☐ Move RefreshTokenRepository.cs:
    From: Backend/src/UabIndia.Infrastructure/Data/
    To:   Backend/src/UabIndia.Infrastructure/Repositories/
  
  ☐ Find all files importing from old location: 
    grep -r "using.*Data" Backend/src/
  
  ☐ Update using statements in: __________ (list files)
  ☐ Update using statements in: __________
  ☐ Update DI registration in Program.cs if needed
  ☐ Compile and verify: dotnet build ✓
  ☐ Verify DI works: dotnet run ✓

Files with updated imports:
  1. ________________
  2. ________________
  3. ________________

Time Estimated: 20 min
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

### [P2.3] Remove Temp Build Directories

```
Task: Delete _temp_build directories and add to .gitignore
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Delete Backend/src/_temp_build directory
  ☐ Delete Backend/src/_temp_build2 directory
  ☐ Add to .gitignore: _temp_build/
  ☐ Add to .gitignore: _temp_build2/
  ☐ Remove from git: git rm -r Backend/src/_temp_build*
  ☐ Commit removal: git commit -m "Remove temp build artifacts"
  ☐ Verify git status is clean

Time Estimated: 5 min
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

---

## 🟡 MEDIUM PRIORITY PHASE (Next Week)

### [P3.1] Consolidate Frontend API Hooks

```
Task: Merge api-hooks-part1.ts and api-hooks-part2.ts into single file
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Create new file: frontend/src/lib/api-hooks.ts
  ☐ Copy all hooks from api-hooks-part1.ts
  ☐ Copy all hooks from api-hooks-part2.ts
  ☐ Organize hooks by functionality/feature
  ☐ Find all imports: grep -r "api-hooks-part" frontend/src/
  
  Files importing from part1: __________ (count)
  Files importing from part2: __________ (count)
  
  ☐ Update imports in each file:
    From: @/lib/api-hooks-part1 or api-hooks-part2
    To:   @/lib/api-hooks
  
  Files updated:
    1. ________________
    2. ________________
    3. ________________
    [continue as needed]
  
  ☐ Delete api-hooks-part1.ts
  ☐ Delete api-hooks-part2.ts
  ☐ Compile and verify: npm run build ✓
  ☐ Check for TypeScript errors in IDE

Time Estimated: 1 hour
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

### [P3.2] Consolidate Frontend Routes

```
Task: Merge individual module routes.ts files into constants/routes.ts
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Expand ROUTES object in constants/routes.ts
  ☐ Add ROUTES.HRMS_ROUTES.ATTENDANCE sub-object
  ☐ Add ROUTES.HRMS_ROUTES.LEAVE sub-object
  ☐ Add ROUTES.HRMS_ROUTES.RECRUITMENT sub-object
  ☐ Find all module files importing routes:
    grep -r "modules/hrms.*routes" frontend/src/
  
  Module files to update:
    1. ________________
    2. ________________
    3. ________________
  
  ☐ Update imports and usage in each file
  ☐ Delete modules/hrms/attendance/routes.ts
  ☐ Delete modules/hrms/leave/routes.ts
  ☐ Delete modules/hrms/recruitment/routes.ts
  ☐ Compile and verify: npm run build ✓
  ☐ Test navigation in browser

Time Estimated: 45 min
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

### [P3.3] Complete/Backlog TODO Items

```
Task: Handle 4 unimplemented TODO tasks in HangfireJobService
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

File: Backend/src/UabIndia.Infrastructure/Services/HangfireJobService.cs

TODO 1: SchedulePayrollCalculation (Line 33)
Decision: ☐ Implement ☐ Disable for now ☐ Move to backlog
If implement: 
  ☐ Create implementation
  ☐ Add unit tests
  Estimated effort: _____ hours
If disable:
  ☐ Comment out code
  ☐ Add TODO with issue reference
If backlog:
  ☐ Create GitHub issue: _______
  ☐ Add reference: Issue #_____
  ☐ Remove from code

TODO 2: ScheduleLeaveExpiry (Line 60)
Decision: ☐ Implement ☐ Disable for now ☐ Move to backlog
Details: ________________________________________________

TODO 3: ScheduleAuditLogArchival (Line 86)
Decision: ☐ Implement ☐ Disable for now ☐ Move to backlog
Details: ________________________________________________

TODO 4: ScheduleCleanup (Line 166)
Decision: ☐ Implement ☐ Disable for now ☐ Move to backlog
Details: ________________________________________________

Time Estimated: 1-2 hours
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

### [P3.4] Delete Empty Test Files

```
Task: Remove placeholder test file (UnitTest1.cs)
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Locate file: Backend/tests/UnitTest1.cs
  ☐ Verify it's empty/placeholder (no real tests)
  ☐ Delete file: rm Backend/tests/UnitTest1.cs
  ☐ Verify test suite runs: dotnet test ✓

Empty test files found:
  1. Backend/tests/UnitTest1.cs ☐ Deleted
  2. ________________ ☐ Deleted
  3. ________________ ☐ Deleted

Time Estimated: 5 min
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

---

## 🟢 LOW PRIORITY PHASE (Polish)

### [P4.1] Centralize Configuration

```
Task: Consolidate duplicate configuration across multiple files
Status: ☐ NOT STARTED  ☐ IN PROGRESS  ☐ COMPLETED  ☐ BLOCKED

Subtasks:
  ☐ Analyze CORS policy duplication:
    Location 1: Program.cs (lines 440-480)
    Location 2: PolicyContext.cs
    ☐ Centralize to Program.cs
  
  ☐ Analyze JWT configuration duplication:
    Location 1: Program.cs
    Location 2: JwtService.cs
    ☐ Centralize to Program.cs
  
  ☐ Analyze Encryption key duplication:
    Location 1: Program.cs
    Location 2: AesEncryptionService.cs
    ☐ Centralize to Program.cs
  
  ☐ Update all services to read from central config
  ☐ Remove redundant configuration code
  ☐ Compile and verify: dotnet build ✓
  ☐ Test configuration loading at startup

Configuration moved from:
  1. ________________ → Program.cs ☐
  2. ________________ → Program.cs ☐
  3. ________________ → Program.cs ☐

Time Estimated: 1 hour
Time Actual: _______ min
Completed by: ________________
Reviewed by: ________________
```

---

## ✅ FINAL VERIFICATION

### Before Merge Checklist

```
BACKEND VERIFICATION:
  ☐ No duplicate controllers
  ☐ No 501 status codes in API
  ☐ No ambiguous route warnings
  ☐ All repositories in correct location
  ☐ Only one logging middleware active
  ☐ No unhandled TODOs
  ☐ No placeholder test files
  ☐ dotnet build completes ✓
  ☐ dotnet run starts ✓
  ☐ No warnings in output

FRONTEND VERIFICATION:
  ☐ No api-hooks-part* references
  ☐ No split routes files
  ☐ Single api-hooks.ts file
  ☐ npm run build completes ✓
  ☐ No TypeScript errors
  ☐ Navigation works end-to-end
  ☐ All features accessible

GIT VERIFICATION:
  ☐ All changes committed
  ☐ .gitignore updated
  ☐ No uncommitted files
  ☐ Branch ready for PR

TESTING VERIFICATION:
  ☐ Unit tests pass
  ☐ Integration tests pass
  ☐ E2E tests pass (if applicable)
  ☐ No new warnings
```

### Sign-Off

```
All tasks completed: ☐ YES  ☐ NO

Completion Date: ________________
Completed by: ________________ (name)
Reviewed by: _________________ (name)
Approved by: _________________ (name)

Risks identified: _______________________________
Mitigation taken: _______________________________
Known issues: ___________________________________
Follow-up tasks: ________________________________
```

---

## 📈 Progress Summary

```
CRITICAL PHASE:
  Status: ________% complete
  Duration: _________ hours actual vs 1.5 hours planned
  Issues: ☐ None ☐ Minor ☐ Major

HIGH PRIORITY PHASE:
  Status: ________% complete
  Duration: _________ hours actual vs 1 hour planned
  Issues: ☐ None ☐ Minor ☐ Major

MEDIUM PRIORITY PHASE:
  Status: ________% complete
  Duration: _________ hours actual vs 3 hours planned
  Issues: ☐ None ☐ Minor ☐ Major

LOW PRIORITY PHASE:
  Status: ________% complete
  Duration: _________ hours actual vs 1 hour planned
  Issues: ☐ None ☐ Minor ☐ Major

OVERALL:
  Status: ________% complete
  Total Duration: _________ hours actual vs 7 hours planned
  Overall Issues: ☐ None ☐ Minor ☐ Major
```

---

## 📝 Notes

```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Tracker Last Updated:** ________________  
**Next Review:** ________________
