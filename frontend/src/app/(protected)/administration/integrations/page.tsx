"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { IntegrationHubManager } from "@/features/administration/components/IntegrationHubManager";

export default function IntegrationsRoute() {
  return (
    <DynamicPage
      pageKey="administration.integrations"
      fallback={<IntegrationHubManager />}
      renderMode="auto"
    />
  );
}

