"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { OrgStructurePage } from "@/features/administration/components/OrgStructurePage";

export default function DepartmentsPage() {
  return (
    <DynamicPage
      pageKey="administration.departments"
      fallback={
        <OrgStructurePage
          resource="departments"
          title="Department Master & Org Hierarchy"
          subtitle="Configure departments, cost allocation, and reporting lines."
          categoryTag="Organization Architecture"
          codeLabel="Department Code"
          nameLabel="Department"
        />
      }
      renderMode="auto"
    />
  );
}

