"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { OrgStructurePage } from "@/features/administration/components/OrgStructurePage";

export default function CostCentersPage() {
  return (
    <DynamicPage
      pageKey="administration.cost-centers"
      fallback={
        <OrgStructurePage
          resource="costCenters"
          title="Cost Centers & GL Allocation"
          subtitle="Define cost centers for finance and payroll allocation."
          categoryTag="Finance Architecture"
          codeLabel="Cost Center Code"
          nameLabel="Cost Center"
          showCostCenterType
        />
      }
      renderMode="auto"
    />
  );
}

