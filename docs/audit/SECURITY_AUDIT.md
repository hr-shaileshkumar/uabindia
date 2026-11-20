# 🛡️ UAB INDIA ENTERPRISE SUITE — CYBERSECURITY AUDIT
**Document ID:** `AUDIT-DOC-009`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Cybersecurity Auditor, Enterprise Software Architect & DevOps Engineer  

---

## 1. Executive Security Evaluation & Threat Posture

The UAB India Enterprise Suite exhibits an above-average baseline security posture for enterprise multi-tenant applications. Essential security controls—including tenant isolation, account lockout, rate limiting, and password hashing—have been implemented natively in the ASP.NET Core request pipeline.

However, specific attack surface weaknesses exist in **file upload validation**, **default credentials in test scripts**, and **concurrency exception management** that require remediation before production deployment.

---

## 2. Comprehensive Security Control Findings

```
                              SECURITY VULNERABILITY SEVERITY BREAKDOWN
  CRITICAL  ░░░░░░░░░░░░░░░░░░░░ (0) - No direct unauthenticated remote code execution or data leaks
  HIGH      ████████████████████ (2) - File upload magic byte bypass, Missing Gratuity cap
  MEDIUM    ██████████████████████████████ (3) - Concurrency silent rollback, Default test credentials, PT engine fallback
  LOW       ████████████████████ (2) - Browserslist outdated, Duplicate API response classes
```

---

## 3. Detailed Security Assessment by Domain

### 3.1 Authentication & Password Security
- **Password Storage**: Uses ASP.NET Core `PasswordHasher<User>`, implementing PBKDF2 with HMAC-SHA512 and unique per-user cryptographically random 128-bit salts. Verified compliant with NIST SP 800-63B standards.
- **Account Lockout & Anti-Bruteforce**:
  - Implemented in `AccountLockoutPolicy.cs` and `AuthController.cs:162-192`.
  - Automatically tracks `AccessFailedCount`. Upon 5 failed attempts within a 15-minute window, locks the account for 15 minutes, returning HTTP 423 Locked.
  - Reset upon successful sign-in.
- **JWT & Token Architecture**:
  - Access Tokens: Short-lived (15 minutes), signed via HMAC-SHA256. Minimum 256-bit secret key enforced at startup (`SecurityAndCorsExtensions.cs:247`).
  - Refresh Tokens: Stored as one-way SHA-256 hashes (`TokenHash`) in the `RefreshTokens` database table. Includes family tracking and immediate revocation upon detected token reuse (`RefreshTokenFamilyTests.cs`).
  - Cookie Security: Employs `HttpOnly = true`, `Secure = true` (in non-dev), and `SameSite = Lax` flags.

### 3.2 Multi-Tenant Boundary Enforcement & Data Isolation
- **Tenant Context Authority**:
  - In `TenantResolverMiddleware.cs:59-65`, once a caller is authenticated, the tenant claim within the validated JWT is the **sole authoritative scope**. Headers (`X-Tenant`, `X-Tenant-Id`) can only confirm or narrow scope, never widen it to an unauthorized tenant.
- **Data Query Isolation**:
  - Every tenant-scoped entity in `ApplicationDbContext` is guarded by an EF Core Global Query Filter (`e.TenantId == _tenantAccessor.GetTenantId()`).
  - Verified: No raw unparameterized SQL queries bypass tenant boundaries.

### 3.3 SQL Injection Resistance
- **EF Core Parameterization**: 99% of data access is performed through strongly-typed EF Core LINQ queries which compile into parameterized `sp_executesql` statements.
- **Raw SQL Inspection**:
  - `AuditLogsController.cs:269-422`: Uses parameterized raw SQL for bulk cascade purging. Table names are verified against EF Core entity metadata dictionaries (`entityType.GetTableName()`), and primary keys are passed as `SqlParameter("@id", ...)`.
  - **Verdict**: Low risk of SQL injection.

### 3.4 Cross-Site Scripting (XSS) & Cross-Site Request Forgery (CSRF)
- **Content Security Policy (CSP)**:
  - Dynamically injected in `Program.cs:373-395` with unique cryptographic per-request nonces (`X-Content-Nonce`).
  - Restricts `frame-ancestors 'none'` (clickjacking prevention), `base-uri 'self'`, and `object-src 'none'`.
- **HTML Sanitization**: Uses `HtmlSanitizer` (version 9.2.995) to strip malicious scripts and attributes from user-supplied rich text.
- **CSRF Defense**:
  - Implements double-submit cookie validation (`CsrfValidationMiddleware.cs`) for state-changing HTTP methods (POST, PUT, DELETE, PATCH).
  - Validates `Origin` and `Referer` headers against the allowed CORS whitelist in `Program.cs:397-439`.

### 3.5 Cryptographic Protection of Sensitive Data (PII)
- **Column-Level Encryption**:
  - Sensitive employee KYC fields (Bank Account Numbers, PAN, Aadhaar) are transparently encrypted at rest using AES-256-GCM via EF Core value converters (`encryptedString` converter in `ApplicationDbContext.cs:306-313`).
- **Log Redaction**:
  - Serilog includes `RedactPIIEnricher` (`Program.cs:181`) to automatically mask PAN, Aadhaar, credit card numbers, and passwords from console and rolling log files.

---

## 4. Security Vulnerability Register

### Vulnerability #1: File Upload MIME / Magic Byte Bypass
- **Severity**: **HIGH**
- **Location**: `Backend/src/UabIndia.Api/Middleware/FileUploadValidationMiddleware.cs:85-98`
- **Vulnerability Description**:
  The middleware validates uploaded files by inspecting the file name extension and the `Content-Type` header passed by the HTTP client:
  ```csharp
  var extension = Path.GetExtension(file.FileName);
  if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension)) ...
  if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType)) ...
  ```
  Both of these indicators are client-controlled. An attacker can rename an executable file (`payload.exe`) or an HTML file containing malicious JavaScript to `invoice.png`, set `Content-Type: image/png`, and bypass validation. If stored on a publicly accessible web root or rendered inline, this presents a stored XSS or code execution threat.
- **Remediation**:
  Implement stream-level magic-byte verification inspecting the first 16 bytes:
  - PDF: starts with `%PDF-` (`0x25, 0x50, 0x44, 0x46`)
  - PNG: starts with `\x89PNG\r\n\x1a\n` (`0x89, 0x50, 0x4E, 0x47`)
  - JPEG: starts with `\xFF\xD8\xFF`
- **Status**: Open / Remediation Pending.

---

### Vulnerability #2: Default Credentials in Scripts and Load Tests
- **Severity**: **MEDIUM**
- **Location**: `Backend/tests/LoadTests/k6-load-test.js:35-36`, `docker-compose.yml:11`
- **Vulnerability Description**:
  Test scripts and local docker compose files contain static fallback credentials (`admin@uabindia.in` / `Admin@123`, `YourSecurePassword123!`).
  While production scripts (`generate-production-secrets.ps1` and `docker-compose.prod.yml`) mandate random passwords via `${DB_PASSWORD:?}`, any environment deployed using the non-prod compose template will inherit weak default credentials.
- **Remediation**:
  Enforce mandatory environment variable checks in all docker compose templates and remove static passwords from source control.
- **Status**: Open / Remediation Pending.

---

### Vulnerability #3: Silent Failure on Secondary Concurrency Exception
- **Severity**: **MEDIUM**
- **Location**: `Backend/src/UabIndia.Infrastructure/Data/ApplicationDbContext.cs:1032-1039`
- **Vulnerability Description**:
  When resolving optimistic concurrency conflicts during `SaveChanges()`, if the retry fails, EF Core detaches the conflicting entities and returns `0` without rethrowing. Calling controllers will receive a successful HTTP 200 response even though no database update occurred.
- **Remediation**:
  Replace `return 0;` with `throw new DbUpdateConcurrencyException("Concurrency conflict could not be resolved.", ex);`.
- **Status**: Open / Remediation Pending.

---

## 5. Security Recommendations Matrix

| Security Recommendation | Impact Area | Priority | Effort |
| :--- | :--- | :---: | :---: |
| Add Magic Byte inspection to `FileUploadValidationMiddleware` | Ingestion Security | **HIGH** | 2 Hours |
| Remove fallback credentials from `docker-compose.yml` | Credential Hardening | **MEDIUM**| 1 Hour |
| Rethrow concurrency exceptions in `ApplicationDbContext.SaveChanges` | Data Integrity | **MEDIUM**| 1 Hour |
| Configure automated database backup cron job in production | Disaster Recovery | **HIGH** | 2 Hours |
| Enforce HTTPS HSTS preloading on production Nginx reverse proxy | Transport Security | **MEDIUM**| 1 Hour |
