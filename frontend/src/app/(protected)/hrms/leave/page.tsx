"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import LeaveManager from "@/features/hrms/components/LeaveManager";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";

export default function LeavePage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.LEAVE_VIEW}>
      <LeaveManager api={hrApi.hrms.leave} />
    </ProtectedRoute>
  );
}
