"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { PortalWorkspaceManager } from "@/features/portal/components/PortalWorkspaceManager";

export default function B2BPortalPage() {
  return (
    <DynamicPage
      pageKey="sales.portal"
      fallback={<PortalWorkspaceManager />}
      renderMode="auto"
    />
  );
}

