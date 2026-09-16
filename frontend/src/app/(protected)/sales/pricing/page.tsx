"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { PricingRulesManager } from "@/features/sales/components/PricingRulesManager";

export default function PricingMatrixPage() {
  return (
    <DynamicPage
      pageKey="sales.pricing"
      fallback={<PricingRulesManager />}
    />
  );
}
