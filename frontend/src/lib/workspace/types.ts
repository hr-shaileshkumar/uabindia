export type AppRole = "super_admin" | "tenant_owner" | "company_admin" | "hr" | "manager" | "employee";
export type GuardScope = "platform_owner" | "business_owner" | "business" | "ess";

// Backward-compatible aliases
export type ERPRole = AppRole;
export type ERPGuardScope = GuardScope;
