"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { FinalSettlementManager } from "@/features/payroll/components/FinalSettlementManager";

export default function FinalSettlementPage() {
  return (
    <DynamicPage
      pageKey="payroll.final-settlement"
      fallback={<FinalSettlementManager />}
      renderMode="auto"
    />
  );
}

