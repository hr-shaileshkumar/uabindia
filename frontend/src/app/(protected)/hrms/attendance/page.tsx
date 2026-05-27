"use client";

import { useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AttendanceList from "@/features/hrms/components/AttendanceList";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";

export default function AttendancePage() {
  const fetchAttendance = useCallback(async () => {
    const page = 1;
    const res = await hrApi.hrms.attendance.list(page);
    return res.data?.records || [];
  }, []);

  return (
    <ProtectedRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
      <AttendanceList fetchAttendance={fetchAttendance} />
    </ProtectedRoute>
  );
}
