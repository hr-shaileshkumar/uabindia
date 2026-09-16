"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import TaxDeclarationsManager from "@/features/payroll/tax-declarations";

export default function TaxDeclarationsPage() {
  return (
    <DynamicPage
      pageKey="payroll.tax-declarations"
      fallback={<TaxDeclarationsManager />}
      renderMode="auto"
    />
  );
}

