"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { BonusManager } from "@/features/payroll/components/BonusManager";

export default function PayrollBonusPage() {
  return (
    <DynamicPage
      pageKey="payroll.bonus"
      fallback={<BonusManager />}
      renderMode="auto"
    />
  );
}

