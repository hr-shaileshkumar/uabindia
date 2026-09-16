"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { WarehouseManagementSystemManager } from "@/features/inventory/components/WarehouseManagementSystemManager";

export default function WarehouseManagementPage() {
  return (
    <DynamicPage
      pageKey="inventory.wms"
      fallback={<WarehouseManagementSystemManager />}
    />
  );
}
