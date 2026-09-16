"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { PurchaseRequestsManager } from "@/features/procurement/components/PurchaseRequestsManager";

export default function ProcurementPurchaseRequestsPage() {
  return (
    <DynamicPage
      pageKey="procurement.purchase-requests"
      fallback={<PurchaseRequestsManager />}
    />
  );
}
