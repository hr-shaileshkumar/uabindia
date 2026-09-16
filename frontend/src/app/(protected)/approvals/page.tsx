"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { ApprovalsWorkflowManager } from "@/features/approvals/components/ApprovalsWorkflowManager";

export default function ApprovalsQueuePage() {
  return (
    <DynamicPage
      pageKey="workflow.approvals"
      fallback={<ApprovalsWorkflowManager />}
      renderMode="auto"
    />
  );
}

