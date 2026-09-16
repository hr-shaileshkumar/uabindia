"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { ChartOfAccountsTree } from "@/features/finance/components/ChartOfAccountsTree";

export default function FinanceChartOfAccountsPage() {
  return (
    <DynamicPage
      pageKey="finance.chart-of-accounts"
      fallback={<ChartOfAccountsTree />}
      renderMode="auto"
    />
  );
}

