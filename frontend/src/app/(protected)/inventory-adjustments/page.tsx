"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { InventoryAdjustmentsManager } from "@/features/inventory/components/InventoryAdjustmentsManager";

export default function InventoryAdjustmentsPage() {
  return (
    <DynamicPage
      pageKey="inventory.adjustments"
      fallback={<InventoryAdjustmentsManager />}
      renderMode="auto"
    />
  );
}

