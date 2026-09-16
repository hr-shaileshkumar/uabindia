"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { SalaryComponentsManager } from "@/features/payroll/components/SalaryComponentsManager";

export default function PayrollComponentsPage() {
  return (
    <DynamicPage
      pageKey="payroll.components"
      fallback={<SalaryComponentsManager />}
      renderMode="auto"
    />
  );
}

