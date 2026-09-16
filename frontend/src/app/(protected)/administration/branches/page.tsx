"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { OrgStructurePage } from "@/features/administration/components/OrgStructurePage";

export default function BranchesPage() {
  return (
    <DynamicPage
      pageKey="administration.branches"
      fallback={
        <OrgStructurePage
          resource="branches"
          title="Branch & Location Master"
          subtitle="Manage corporate branches, warehouses, and GSTIN locations."
          categoryTag="Organization Architecture"
          codeLabel="Branch Code"
          nameLabel="Branch"
          showLocationFields
          showWarehouseToggle
        />
      }
      renderMode="auto"
    />
  );
}

