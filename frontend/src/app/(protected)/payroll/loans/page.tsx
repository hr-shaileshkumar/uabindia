"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import LoansManager from "@/features/payroll/loans";

export default function PayrollLoansPage() {
  return (
    <DynamicPage
      pageKey="payroll.loans"
      fallback={<LoansManager />}
      renderMode="auto"
    />
  );
}

