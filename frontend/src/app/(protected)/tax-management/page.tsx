"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { TaxEngineManager } from "@/features/finance/components/TaxEngineManager";

export default function TaxManagementRoute() {
  return (
    <DynamicPage
      pageKey="finance.tax-management"
      fallback={<TaxEngineManager />}
      renderMode="auto"
    />
  );
}

