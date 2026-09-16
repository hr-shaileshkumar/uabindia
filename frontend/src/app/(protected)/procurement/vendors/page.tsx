"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import VendorsManager from "@/features/procurement/components/VendorsManager";

export default function ProcurementVendorsPage() {
  return (
    <DynamicPage
      pageKey="procurement.vendors"
      fallback={<VendorsManager />}
      renderMode="auto"
    />
  );
}

