"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { DiscountsManager } from "@/features/sales/components/DiscountsManager";

export default function SalesDiscountsPage() {
  return (
    <DynamicPage
      pageKey="sales.discounts"
      fallback={<DiscountsManager />}
    />
  );
}
