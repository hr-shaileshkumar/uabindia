"use client";

import LifecycleTasksPage from "@/features/hrms/components/LifecycleTasksPage";

export default function OffboardingPage() {
  return <LifecycleTasksPage kind="Offboarding" title="Employee Offboarding" queryKey="offboarding-tasks" />;
}
