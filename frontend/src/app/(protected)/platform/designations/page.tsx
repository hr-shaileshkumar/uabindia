"use client";

import { OrgStructurePage } from "@/features/platform/components/OrgStructurePage";

export default function DesignationsPage() {
  return (
    <OrgStructurePage
      resource="designations"
      title="Designation & Job Grade Registry"
      subtitle="Manage job titles, grades, and compensation bands."
      categoryTag="Organization Architecture"
      codeLabel="Designation Code"
      nameLabel="Designation"
      showGradeFields
    />
  );
}
