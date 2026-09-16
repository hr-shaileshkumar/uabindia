"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { WorkOrdersManager } from "@/features/manufacturing/components/WorkOrdersManager";

export default function WorkOrdersPage() {
  return (
    <DynamicPage
      pageKey="manufacturing.work-orders"
      fallback={<WorkOrdersManager />}
      renderMode="auto"
    />
  );
}

