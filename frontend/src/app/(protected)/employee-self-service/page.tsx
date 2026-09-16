"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { EmployeeSelfServicePortalManager } from "@/features/hrms/components/EmployeeSelfServicePortalManager";

export default function EmployeeSelfServicePage() {
  return (
    <DynamicPage
      pageKey="hrms.employee-self-service"
      fallback={<EmployeeSelfServicePortalManager />}
      renderMode="auto"
    />
  );
}

