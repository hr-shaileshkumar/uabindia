"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { InventoryTransfersManager } from "@/features/inventory/components/InventoryTransfersManager";

export default function InventoryTransfersPage() {
  return (
    <DynamicPage
      pageKey="inventory.transfers"
      fallback={<InventoryTransfersManager />}
      renderMode="auto"
    />
  );
}

