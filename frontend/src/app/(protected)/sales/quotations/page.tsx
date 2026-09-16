"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import QuotationManager from "@/features/sales/quotations";

export default function SalesQuotationsPage() {
  return (
    <DynamicPage
      pageKey="sales.quotations"
      fallback={<QuotationManager />}
      renderMode="auto"
    />
  );
}

