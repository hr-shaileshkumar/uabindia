"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { OrgStructurePage } from "@/features/administration/components/OrgStructurePage";

export default function BusinessUnitsPage() {
  return (
    <DynamicPage
      pageKey="administration.business-units"
      fallback={
        <OrgStructurePage
          resource="businessUnits"
          title="Business Units & Legal Entities"
          subtitle="Group companies and subsidiaries under business units."
          categoryTag="Organization Architecture"
          codeLabel="Business Unit Code"
          nameLabel="Business Unit"
        />
      }
      renderMode="auto"
    />
  );
}

