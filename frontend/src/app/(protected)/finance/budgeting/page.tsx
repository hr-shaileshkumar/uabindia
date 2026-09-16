"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { BudgetingManager } from "@/features/finance/components/BudgetingManager";

export default function BudgetingVariancePage() {
  return (
    <DynamicPage
      pageKey="finance.budgeting"
      fallback={<BudgetingManager />}
      renderMode="auto"
    />
  );
}

