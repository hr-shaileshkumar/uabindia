"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { WebhooksManager } from "@/features/administration/components/WebhooksManager";

export default function IntegrationsWebhooksPage() {
  return (
    <DynamicPage
      pageKey="integrations.webhooks"
      fallback={<WebhooksManager />}
      renderMode="auto"
    />
  );
}

