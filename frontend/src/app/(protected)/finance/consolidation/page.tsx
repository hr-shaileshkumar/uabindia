"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { FinancialConsolidationManager } from "@/features/finance/components/FinancialConsolidationManager";

export default function FinancialConsolidationPage() {
  return (
    <DynamicPage
      pageKey="finance.consolidation"
      fallback={<FinancialConsolidationManager />}
      renderMode="auto"
    />
  );
}

