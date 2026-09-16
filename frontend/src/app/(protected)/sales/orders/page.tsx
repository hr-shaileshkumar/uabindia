"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { SalesOrdersManager } from "@/features/sales/components/SalesOrdersManager";

export default function SalesOrdersPage() {
  return (
    <DynamicPage
      pageKey="sales.orders"
      fallback={<SalesOrdersManager />}
      renderMode="auto"
    />
  );
}

