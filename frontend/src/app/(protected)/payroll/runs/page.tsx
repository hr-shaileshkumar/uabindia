"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { PayrollRunList } from "@/features/payroll/components/PayrollRunList";

export default function PayrollRunsRoute() {
  return (
    <DynamicPage
      pageKey="payroll.runs"
      fallback={<PayrollRunList />}
      renderMode="auto"
    />
  );
}

