"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { InvoicesManager } from "@/features/sales/components/InvoicesManager";

export default function InvoicesPage() {
  return (
    <DynamicPage
      pageKey="sales.invoices"
      fallback={<InvoicesManager />}
      renderMode="auto"
    />
  );
}

