"use client";

import LifecycleTasksPage from "@/features/hrms/components/LifecycleTasksPage";

export default function OnboardingPage() {
  return <LifecycleTasksPage kind="Onboarding" title="Employee Onboarding" queryKey="onboarding-tasks" />;
}
