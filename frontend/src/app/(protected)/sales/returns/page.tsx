"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import ReturnsManager from "@/features/sales/returns";

export default function SalesReturnsPage() {
  return (
    <DynamicPage
      pageKey="sales.returns"
      fallback={<ReturnsManager />}
      renderMode="auto"
    />
  );
}

