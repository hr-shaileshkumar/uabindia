"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import LeaveManager from "@/features/hrms/leave/components/LeaveManager";

export default function LeavePage() {
  return (
    <DynamicPage
      pageKey="hrms.leave"
      fallback={<LeaveManager />}
      renderMode="auto"
    />
  );
}

