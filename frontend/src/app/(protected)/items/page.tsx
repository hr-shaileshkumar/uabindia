"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ItemsManager from "@/features/erp/components/ItemsManager";
import SchemaCrudPage from "@/features/erp/components/SchemaCrudPage";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";

export default function ItemsPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.ITEM_VIEW}>
      <SchemaCrudPage
        pageKey="items"
        api={hrApi.erp.items}
        fallback={<ItemsManager api={hrApi.erp.items} />}
        fallbackTitle="Items"
        fallbackSubtitle="Inventory and product master"
      />
    </ProtectedRoute>
  );
}
