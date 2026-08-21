"use client";

import { OrgStructurePage } from "@/features/platform/components/OrgStructurePage";

export default function BranchesPage() {
  return (
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
  );
}
