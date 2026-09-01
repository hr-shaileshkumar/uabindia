"use client";

// Re-export from centralized features/tenants module
export {
  TenantWizard,
  buildTenantCreatePayload,
  buildTenantUpdatePayload,
  getDefaultTenantForm,
  type TenantWizardProps,
} from "@/features/tenants/components/TenantWizard";
