"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { SuperadminTenantsManager } from "@/features/administration/components/SuperadminTenantsManager";

export default function SuperAdminDashboardRoute() {
  return (
    <DynamicPage
      pageKey="superadmin.dashboard"
      fallback={<SuperadminTenantsManager />}
      renderMode="auto"
    />
  );
}

