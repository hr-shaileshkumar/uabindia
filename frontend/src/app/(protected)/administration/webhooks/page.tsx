"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { WebhooksManager } from "@/features/administration/components/WebhooksManager";

export default function PlatformWebhooksPage() {
  return (
    <DynamicPage
      pageKey="administration.webhooks"
      fallback={<WebhooksManager />}
      renderMode="auto"
    />
  );
}

