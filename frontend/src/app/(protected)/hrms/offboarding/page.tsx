"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import LifecycleTasksPage from "@/features/hrms/components/LifecycleTasksPage";

export default function OffboardingPage() {
  return (
    <DynamicPage
      pageKey="hrms.offboarding"
      fallback={<LifecycleTasksPage kind="Offboarding" title="Employee Offboarding" queryKey="offboarding-tasks" />}
      renderMode="auto"
    />
  );
}

