"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { EmployeeLifecycleManager } from "@/features/hrms/components/EmployeeLifecycleManager";

export default function HrLifecyclePage() {
  return (
    <DynamicPage
      pageKey="hrms.lifecycle"
      fallback={<EmployeeLifecycleManager />}
    />
  );
}
