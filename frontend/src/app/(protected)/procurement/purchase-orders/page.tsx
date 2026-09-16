"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { PurchaseOrdersManager } from "@/features/procurement/components/PurchaseOrdersManager";

export default function ProcurementPurchaseOrdersPage() {
  return (
    <DynamicPage
      pageKey="procurement.orders"
      fallback={<PurchaseOrdersManager />}
      renderMode="auto"
    />
  );
}

