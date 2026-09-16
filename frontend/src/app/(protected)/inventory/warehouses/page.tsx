"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { WarehouseManager } from "@/features/inventory/warehouses";

export default function InventoryWarehousesPage() {
  return (
    <DynamicPage
      pageKey="inventory.warehouses"
      fallback={<WarehouseManager />}
      renderMode="auto"
    />
  );
}

