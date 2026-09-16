"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { OrgStructurePage } from "@/features/administration/components/OrgStructurePage";

export default function DesignationsPage() {
  return (
    <DynamicPage
      pageKey="administration.designations"
      fallback={
        <OrgStructurePage
          resource="designations"
          title="Designation & Job Grade Registry"
          subtitle="Manage job titles, grades, and compensation bands."
          categoryTag="Organization Architecture"
          codeLabel="Designation Code"
          nameLabel="Designation"
          showGradeFields
        />
      }
      renderMode="auto"
    />
  );
}

