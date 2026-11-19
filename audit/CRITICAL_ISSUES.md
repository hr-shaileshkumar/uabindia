# ⚠️ UAB INDIA ENTERPRISE SUITE — CRITICAL ISSUES & DEFECT CATALOG
**Document ID:** `AUDIT-DOC-014`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Cybersecurity Auditor, Enterprise Software Architect, Senior Full-Stack Developer & Technical Project Manager  

---

## 1. Executive Summary & Defect Severity Matrix

During our independent technical investigation of the UAB India codebase, we verified **12 distinct architectural weaknesses, code defects, security gaps, and configuration inconsistencies**.

```
                              CRITICAL ISSUES BY SEVERITY
  CRITICAL  ██████████ (1) - Functional code defect directly impacting user interface
  HIGH      ████████████████████████████████████████ (4) - Legal compliance cap, file upload security, concurrency, PT
  MEDIUM    ████████████████████████████████████████ (4) - Git state, config contradiction, default test secrets, logs
  LOW       ██████████████████████████████ (3) - Duplicate classes, empty directory, duplicate config
```

---

## 2. Comprehensive Defect Catalog

---

### Issue #1: Hardcoded Projection in Leave Applications Endpoint
- **Severity**: **CRITICAL (P0)**
- **Location**: `Backend/src/Modules/HRMS/Controllers/LeaveController.cs` (Lines 64–66)
- **Problem**:
  The `GetLeaveApplications` endpoint projects static string placeholders instead of loading relational data from the database:
  ```csharp
  var list = await query
      .OrderByDescending(r => r.CreatedAt)
      .Select(r => new
      {
          r.Id,
          r.EmployeeId,
          EmployeeName = "Employee",
          LeaveTypeId = r.LeavePolicyId,
          LeaveTypeName = "Leave",
          StartDate = r.FromDate,
          EndDate = r.ToDate,
          ...
      })
      .ToListAsync();
  ```
- **Why It Is a Problem**: Every row returned to the frontend display renders `"Employee"` as the employee name and `"Leave"` as the leave category, regardless of who applied or which leave type was selected.
- **Business Impact**: Confusing, broken, and unviable leave management interface in the enterprise portal.
- **Recommended Solution**:
  Perform an EF Core query join with `_db.Employees` and `_db.LeavePolicies` / `_db.LeaveTypes`:
  ```csharp
  from req in _db.LeaveRequests.AsNoTracking().Where(r => r.TenantId == tenantId && !r.IsDeleted)
  join emp in _db.Employees.AsNoTracking() on req.EmployeeId equals emp.Id into emps
  from emp in emps.DefaultIfEmpty()
  join policy in _db.LeavePolicies.AsNoTracking() on req.LeavePolicyId equals policy.Id into policies
  from policy in policies.DefaultIfEmpty()
  select new {
      req.Id,
      req.EmployeeId,
      EmployeeName = emp != null ? (emp.FullName ?? emp.EmployeeCode) : "Unknown",
      LeaveTypeId = req.LeavePolicyId,
      LeaveTypeName = policy != null ? policy.Name : "General Leave",
      ...
  }
  ```

---

### Issue #2: Missing ₹20 Lakh Statutory Ceiling on Gratuity
- **Severity**: **HIGH (P1)**
- **Location**: `Backend/src/UabIndia.Infrastructure/Services/PayrollSettlementService.cs` (Lines 34–36)
- **Problem**:
  Gratuity calculation in Full & Final (F&F) settlements computes `(lastBasic * 15m / 26m * yearsRounded)` without applying the statutory cap:
  ```csharp
  var gratuity = years >= 4.5d && lastBasic > 0
      ? IndiaStatutoryCalculator.RoundMoney(lastBasic * 15m / 26m * yearsRounded)
      : 0m;
  ```
- **Why It Is a Problem**: Under Section 4(3) of the Payment of Gratuity Act 1972, statutory gratuity payable to an employee cannot exceed the Central Government ceiling of **₹20,00,000 (Twenty Lakhs Rupees)**. Uncapped calculation causes illegal financial overstatement for high-earning senior staff.
- **Business Impact**: Statutory non-compliance, legal liability, and financial audit objections.
- **Recommended Solution**:
  Apply statutory cap: `Math.Min(calculatedGratuity, 2000000m)`.

---

### Issue #3: Missing Magic Byte (Stream Signature) Verification in File Uploads
- **Severity**: **HIGH (P1)**
- **Location**: `Backend/src/UabIndia.Api/Middleware/FileUploadValidationMiddleware.cs` (Lines 85–98)
- **Problem**:
  The upload validation middleware validates file safety solely by checking the file extension string (`Path.GetExtension(file.FileName)`) and the HTTP `Content-Type` header:
  ```csharp
  var extension = Path.GetExtension(file.FileName);
  if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension)) ...
  if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType)) ...
  ```
- **Why It Is a Problem**: Both file extension and `Content-Type` are client-controlled values. An attacker can upload an executable (`shell.exe`) or an HTML file by renaming it to `receipt.png` and sending `Content-Type: image/png`.
- **Business Impact**: Potential Stored XSS, remote code execution, or unauthorized file staging on enterprise servers.
- **Recommended Solution**:
  Inspect stream-level header bytes against standard magic numbers (`%PDF-` for PDFs, `\x89PNG` for PNGs, `\xFF\xD8\xFF` for JPEGs).

---

### Issue #4: Silent Failure on Secondary Optimistic Concurrency Conflicts
- **Severity**: **HIGH (P1)**
- **Location**: `Backend/src/UabIndia.Infrastructure/Data/ApplicationDbContext.cs` (Lines 1032–1039)
- **Problem**:
  In `ApplicationDbContext.SaveChanges()`, if an optimistic concurrency conflict cannot be resolved on retry, the exception is caught, entities are detached, and `0` is returned:
  ```csharp
  catch (DbUpdateConcurrencyException)
  {
      foreach (var entry in ex.Entries)
      {
          entry.State = EntityState.Detached;
      }
      return 0;
  }
  ```
- **Why It Is a Problem**: The calling controller or domain service receives `0` saved rows without any error thrown, resulting in an HTTP 200 OK response sent to the client even though the user's update was completely discarded.
- **Business Impact**: Silent data loss and state corruption under concurrent multi-user editing.
- **Recommended Solution**:
  Log a critical warning and re-throw `DbUpdateConcurrencyException` so the HTTP pipeline can return a standard HTTP 409 Conflict.

---

### Issue #5: Hardcoded Flat Professional Tax Fallback in `IndiaPayrollEngine`
- **Severity**: **HIGH (P1)**
- **Location**: `Backend/src/UabIndia.Infrastructure/Services/Payroll/IndiaPayrollEngine.cs` (Line 53)
- **Problem**:
  `decimal pt = gross > 15000m ? 200m : 0m;` hardcodes ₹200 for gross > ₹15,000.
- **Why It Is a Problem**: Professional Tax is governed by state-specific enactments with diverging slab structures across Maharashtra, Karnataka, Tamil Nadu, and West Bengal. A flat ₹200 rule causes erroneous payroll deductions for employees outside standard Karnataka bands.
- **Business Impact**: Compliance notices and tax penalty assessments from State Commercial Tax Departments.
- **Recommended Solution**:
  Invoke `IndiaStatutoryCalculator.CalculateProfessionalTax(stateCode, gross, month)`.

---

### Issue #6: Environment Variable URL Contradiction
- **Severity**: **MEDIUM (P2)**
- **Location**: `docker-compose.prod.yml` (Line 149) vs `frontend/README.md` (Line 30)
- **Problem**:
  `frontend/README.md` instructs: *"Keep API origins at the backend host only; Do not append `/api/v1` to env values"*.
  However, `docker-compose.prod.yml` sets `NEXT_PUBLIC_API_URL=http://backend:5000/api/v1`.
- **Why It Is a Problem**: Frontend client service calls that append `/api/v1/...` will generate malformed requests (`/api/v1/api/v1/...`) in production containers.
- **Business Impact**: API connection failures upon production container deployment.
- **Recommended Solution**:
  Standardize `docker-compose.prod.yml` to `NEXT_PUBLIC_API_URL=http://backend:5000`.

---

### Issue #7: Static Fallback Credentials in Scripts and Compose Files
- **Severity**: **MEDIUM (P2)**
- **Location**: `Backend/tests/LoadTests/k6-load-test.js` (Lines 35–36), `docker-compose.yml` (Line 11)
- **Problem**:
  Static passwords (`Admin@123`, `YourSecurePassword123!`) are embedded in test scripts and local compose files.
- **Why It Is a Problem**: Weak default passwords may be accidentally inherited in dev/staging environments.
- **Business Impact**: Unauthorized access if test endpoints are exposed to public networks.
- **Recommended Solution**:
  Mandate environment variable injection across all script and compose files.

---

### Issue #8: Massive Build Logs Bloating Repository
- **Severity**: **MEDIUM (P2)**
- **Location**: `infra_build.log` (2.62 MB), `build.log` (274 KB), `Backend/src/UabIndia.Api/msbuild.log` (1.01 MB)
- **Problem**:
  Over 3.8 MB of raw compiler and build logs are tracked in the workspace.
- **Why It Is a Problem**: Slows git clone/pull operations and clutters source repository.
- **Business Impact**: Unnecessary repository bloat.
- **Recommended Solution**:
  Add `*.log` to `.gitignore` and delete log files.

---

### Issue #9: Uncommitted Working Tree Drift in `frontend-hrms`
- **Severity**: **MEDIUM (P2)**
- **Location**: `frontend-hrms/src/module/...`, `frontend-hrms/src/metadata/...`
- **Problem**:
  Over 70 old files were deleted and replaced by a metadata-driven dynamic engine, but remain unstaged in git.
- **Why It Is a Problem**: A `git checkout` or automated deployment could accidentally restore obsolete component trees or cause merge conflicts.
- **Business Impact**: Deployment instability.
- **Recommended Solution**:
  Stage and commit the metadata engine migration to lock in the clean baseline.

---

### Issue #10: Conflicting Root and Subfolder `nginx.conf`
- **Severity**: **LOW (P3)**
- **Location**: `/nginx.conf` (5.6 KB) vs `nginx/nginx.conf` (7.3 KB)
- **Problem**:
  Two diverging Nginx configurations exist in the repository.
- **Business Impact**: Developer confusion during server configuration updates.
- **Recommended Solution**:
  Merge any missing directives into `nginx/nginx.conf` and delete root `nginx.conf`.

---

### Issue #11: Empty Orphaned Directory `Backend/src/UabIndia.SharedKernel`
- **Severity**: **LOW (P3)**
- **Location**: `Backend/src/UabIndia.SharedKernel`
- **Problem**:
  Empty folder with zero files and no `.csproj` reference in `UabIndia.sln`.
- **Business Impact**: Architectural confusion.
- **Recommended Solution**:
  Delete the empty folder.

---

### Issue #12: Duplicate `ApiResponse.cs` Class in Application Layer
- **Severity**: **LOW (P3)**
- **Location**: `Backend/src/UabIndia.Application/Common/Models/ApiResponse.cs` vs `Backend/src/UabIndia.Application/Models/ApiResponse.cs`
- **Problem**:
  Two copies of the API response wrapper exist under separate subnamespaces in the same project.
- **Business Impact**: Code redundancy and namespace ambiguity.
- **Recommended Solution**:
  Consolidate into `UabIndia.Application.Common.Models.ApiResponse` and delete the duplicate.
