"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { SuperadminTenantsManager } from "@/features/administration/components/SuperadminTenantsManager";

export default function TenantsControlPlanePage() {
  return (
    <DynamicPage
      pageKey="administration.tenants"
      fallback={<SuperadminTenantsManager />}
      renderMode="auto"
    />
  );
}

