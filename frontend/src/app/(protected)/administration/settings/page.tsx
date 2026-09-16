"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { TenantAdminSettingsManager } from "@/features/administration/components/TenantAdminSettingsManager";

export default function PlatformSettingsPage() {
  return (
    <DynamicPage
      pageKey="administration.settings"
      fallback={<TenantAdminSettingsManager />}
    />
  );
}
