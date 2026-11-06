# 20 — Architecture Risk Register & Mitigation Guardrails

## Risk Assessment Matrix

| ID | Risk Description | Severity | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | Breaking existing API contracts during standardization | **High** | Low | High | Enforce non-breaking additive changes; maintain legacy endpoints with 301/308 redirects. |
| **R-02** | Accidental leakage of tenant-specific schema overrides | **Critical**| Low | Critical | Strict EF Core query filters on `UiPageDefinition.TenantId`; automated tenant boundary test suite. |
| **R-03** | Performance degradation from dynamic schema fetching | **Medium** | Medium | Medium | In-memory L1 cache on .NET backend; Redis L2 cache; SWR client cache on Next.js. |
| **R-04** | Over-metadatizing complex business calculations | **High** | Medium | High | Strict boundary rule: Payroll, GL, and compliance stay in compiled C# domain services. |
| **R-05** | UI regression during page migration | **Medium** | Medium | Medium | Implement dual-render mode with instant feature-flag rollback per page/tenant. |
| **R-06** | Browser bundle bloat from dynamic field registries | **Low** | Low | Low | Dynamic `React.lazy()` imports for heavy components (RichText, Diagram, CodeEditor). |
