"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import LifecycleTasksPage from "@/features/hrms/components/LifecycleTasksPage";

export default function OnboardingPage() {
  return (
    <DynamicPage
      pageKey="hrms.onboarding"
      fallback={<LifecycleTasksPage kind="Onboarding" title="Employee Onboarding" queryKey="onboarding-tasks" />}
      renderMode="auto"
    />
  );
}

