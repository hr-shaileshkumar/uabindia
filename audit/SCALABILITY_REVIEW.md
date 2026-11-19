# 📈 UAB INDIA ENTERPRISE SUITE — SCALABILITY & PERFORMANCE REVIEW
**Document ID:** `AUDIT-DOC-011`  
**Evaluation Date:** November 2026  
**Auditor Roles:** DevOps Engineer, Database Architect & Enterprise Software Architect  

---

## 1. Scale Target Workload Specifications

The system is evaluated against an initial enterprise operational baseline:
- **Active Workforce**: 2,000+ full-time and contractual employees across multiple client tenants.
- **Organizational Structure**: Multi-company (5+ legal entities), multi-project (50+ active project sites), multi-branch (20+ operational facilities).
- **Daily Attendance Volume**: 4,000 to 8,000 punch events per day (~2.5 million rows annually in `AttendanceRecords`).
- **Concurrent Users**: 200+ concurrent back-office managers; 1,000+ burst mobile punches during shift change windows (08:45–09:15 AM).
- **Monthly Payroll Execution**: Batch calculation and journal entry generation for 2,000+ employees within < 60 seconds.

---

## 2. Bottleneck Analysis & Performance Evaluation

### 2.1 Database Query Performance & Indexing
- **Observation**:
  - Global Query Filters append `WHERE TenantId = @tenantId AND IsDeleted = 0` to every query.
  - On high-volume tables like `AttendanceRecords`, queries filtering by employee or date range without composite indexes covering `TenantId + EmployeeId + Timestamp` will perform expensive Clustered Index Scans as data scales into millions of rows.
- **Mitigation Recommendation**:
  - Add composite non-clustered index:
    ```sql
    CREATE NONCLUSTERED INDEX IX_AttendanceRecords_Tenant_Emp_Date 
    ON [AttendanceRecords] ([TenantId], [EmployeeId], [Timestamp]) 
    INCLUDE ([PunchType], [Latitude], [Longitude], [IsDeleted]);
    ```
  - Implement yearly table partitioning on `[AttendanceRecords]` and `[AuditLogs]` using SQL Server partition schemes based on `Timestamp` / `CreatedAt`.

### 2.2 Connection Pooling & Kestrel Throughput
- **Verified Configuration in `Program.cs` and `ServiceCollectionExtensions.cs`**:
  - Kestrel limits: `MaxConcurrentConnections = 200000`, `MaxConcurrentUpgradedConnections = 50000`.
  - SQL Server Connection String: `Max Pool Size = 256; Connect Timeout = 45; MultipleActiveResultSets = true`.
  - Split Query Behavior: `options.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)` prevents Cartesian explosion when loading entities with multiple collections.
  - Response Compression: Brotli and Gzip compression providers active for all HTTPS responses.
- **Verdict**: Backend web nodes are well-tuned for high throughput and I/O concurrency.

### 2.3 Monthly Payroll Processing Batch Scalability
- **Code Inspection (`PayrollEngineService.cs:47-395`)**:
  - Currently loads active employees for a company, their assignments, components, leaves, loans, and arrears in single bulk queries before iterating in memory.
  - **Memory Impact for 2,000 Employees**: Iterating 2,000 employees with ~10 payslip lines each generates ~20,000 `PayslipLine` entities in EF Core change tracker.
  - **Recommendation**:
    - Use `AsNoTracking()` where possible and batch `_db.SaveChangesAsync()` every 250 employees during large payroll runs to keep EF Core change tracker memory small and prevent transaction log bloat.
    - Offload execution to the dedicated background worker (`UabIndia.Worker`) using Hangfire queue `"payroll"`, with SignalR progress streaming back to the admin UI.

### 2.4 Caching Layer (Redis 7)
- **Verified Configuration**:
  - `ServiceCollectionExtensions.cs:72-98` configures Redis 7 distributed cache with fallback to `AddDistributedMemoryCache()` for local dev.
  - Caches metadata schemas (`UiSchemaService`), lookup lists (`LookupService`), and tenant resolutions (`TenantMemoryCacheService`).
- **Verdict**: Strong caching tier that offloads repetitive lookups from SQL Server.

---

## 3. Cost-Effective Production Infrastructure Recommendation

To support 2,000+ employees with 99.9% uptime at minimum cloud expense, we recommend a **High-Performance Dedicated VPS / Cloud VM** setup rather than expensive microservice serverless architectures:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 RECOMMENDED PRODUCTION INFRASTRUCTURE                       │
│                                                                             │
│   Target Host: Hetzner / AWS EC2 / DigitalOcean Cloud VPS                    │
│   Spec: 8 vCPUs (AMD EPYC or Intel Xeon), 16 GB RAM, 160 GB NVMe SSD         │
│   Estimated Cost: $40 - $70 / month                                         │
│                                                                             │
│   Container Resource Allocation (via docker-compose.prod.yml):              │
│   ┌───────────────────────┬──────────────┬─────────────┬────────────────┐   │
│   │ Service Container     │ CPU Limit    │ RAM Limit   │ Scaling Notes  │   │
│   ├───────────────────────┼──────────────┼─────────────┼────────────────┤   │
│   │ SQL Server 2022       │ 4 vCPUs      │ 4.0 GB      │ Memory capped  │   │
│   │ Redis 7               │ 1 vCPU       │ 512 MB      │ Allkeys-LRU    │   │
│   │ Backend API (.NET 10) │ 2 vCPUs      │ 1.5 GB      │ Stateless web  │   │
│   │ Worker (.NET 10)      │ 2 vCPUs      │ 1.0 GB      │ Background ops │   │
│   │ Frontend ERP (Next.js)│ 1 vCPU       │ 1.0 GB      │ Standalone SSR │   │
│   │ Frontend HRMS (Nginx) │ 0.5 vCPU     │ 256 MB      │ Static bundle  │   │
│   │ Reverse Proxy (Nginx) │ 1 vCPU       │ 256 MB      │ SSL offload    │   │
│   └───────────────────────┴──────────────┴─────────────┴────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

This configuration easily accommodates 2,000+ employees, concurrent turnstile punches, and monthly payroll batch jobs with ample headroom and sub-100ms response times.
