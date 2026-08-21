"use client";

import { OrgStructurePage } from "@/features/platform/components/OrgStructurePage";

export default function DepartmentsPage() {
  return (
    <OrgStructurePage
      resource="departments"
      title="Department Master & Org Hierarchy"
      subtitle="Configure departments, cost allocation, and reporting lines."
      categoryTag="Organization Architecture"
      codeLabel="Department Code"
      nameLabel="Department"
    />
  );
}
