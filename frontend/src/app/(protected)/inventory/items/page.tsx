"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import ItemsManager from "@/features/inventory/components/ItemsManager";

export default function InventoryItemsPage() {
  return (
    <DynamicPage
      pageKey="inventory.items"
      fallback={<ItemsManager />}
      renderMode="auto"
    />
  );
}

