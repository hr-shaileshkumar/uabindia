"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { HelpdeskQueuePage } from "@/components/workspace/helpdesk-queue-page";

export default function HelpdeskTicketsPage() {
  return (
    <DynamicPage
      pageKey="helpdesk.tickets"
      fallback={<HelpdeskQueuePage />}
      renderMode="auto"
    />
  );
}

