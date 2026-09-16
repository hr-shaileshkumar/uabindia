"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { ComplianceManager } from "@/features/compliance/components/ComplianceManager";

export default function StatutoryCompliancePage() {
  return (
    <DynamicPage
      pageKey="compliance.statutory"
      fallback={<ComplianceManager />}
      renderMode="auto"
    />
  );
}

