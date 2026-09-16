"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { PerformanceManager } from "@/features/hrms/components/PerformanceManager";

export default function PerformancePage() {
  return (
    <DynamicPage
      pageKey="hrms.performance"
      fallback={<PerformanceManager />}
      renderMode="auto"
    />
  );
}

