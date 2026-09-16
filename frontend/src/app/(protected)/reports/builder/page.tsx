"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { ReportBuilderManager } from "@/features/analytics/components/ReportBuilderManager";

export default function ReportsBuilderPage() {
  return (
    <DynamicPage
      pageKey="reports.builder"
      fallback={<ReportBuilderManager />}
      renderMode="auto"
    />
  );
}

