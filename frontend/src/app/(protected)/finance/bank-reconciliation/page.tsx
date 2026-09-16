"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import BankReconciliationManager from "@/features/finance/bank-reconciliation";

export default function FinanceBankReconciliationPage() {
  return (
    <DynamicPage
      pageKey="finance.bank-reconciliation"
      fallback={<BankReconciliationManager />}
      renderMode="auto"
    />
  );
}

