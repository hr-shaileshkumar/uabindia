"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { CustomReportsManager } from "@/features/analytics/components/CustomReportsManager";

export default function CustomReportsPage() {
  return (
    <DynamicPage
      pageKey="reports.custom"
      fallback={<CustomReportsManager />}
      renderMode="auto"
    />
  );
}

