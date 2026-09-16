"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { PayslipList } from "@/features/payroll/components/PayslipList";

export default function PayslipsRoute() {
  return (
    <DynamicPage
      pageKey="payroll.payslips"
      fallback={<PayslipList />}
      renderMode="auto"
    />
  );
}

