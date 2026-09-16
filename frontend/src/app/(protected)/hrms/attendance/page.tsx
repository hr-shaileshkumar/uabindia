"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import AttendanceList, { type AttendanceRecord } from "@/features/hrms/attendance";
import { hrmsApi } from "@/services/modules";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const employeeId = searchParams?.get("employeeId")?.trim() || undefined;

  const fetchAttendance = useCallback(async (): Promise<AttendanceRecord[]> => {
    const response = await hrmsApi.hrms.attendance.list(1, 50, employeeId ? { employeeId } : undefined);
    const raw = response.data;
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.records)
        ? raw.records
        : Array.isArray(raw?.attendance)
          ? raw.attendance
          : [];

    return items.map((item: Record<string, unknown>, index: number) => ({
      id: String(item.id ?? item.attendanceId ?? index),
      date: typeof item.date === "string"
        ? item.date
        : typeof item.timestamp === "string"
          ? new Date(item.timestamp).toLocaleDateString()
          : undefined,
      employeeName:
        typeof item.employeeName === "string"
          ? item.employeeName
          : typeof item.fullName === "string"
            ? item.fullName
            : undefined,
      employeeCode: typeof item.employeeCode === "string" ? item.employeeCode : undefined,
      status: typeof item.status === "string"
        ? item.status.toLowerCase()
        : typeof item.punchType === "string"
          ? item.punchType.toLowerCase()
          : undefined,
      checkIn:
        typeof item.checkIn === "string"
          ? item.checkIn
          : typeof item.punchType === "string" && item.punchType.toUpperCase() === "IN" && typeof item.timestamp === "string"
            ? item.timestamp
            : undefined,
      checkOut:
        typeof item.checkOut === "string"
          ? item.checkOut
          : typeof item.punchType === "string" && item.punchType.toUpperCase() === "OUT" && typeof item.timestamp === "string"
            ? item.timestamp
            : undefined,
      punchType: typeof item.punchType === "string" ? item.punchType : undefined,
      timestamp: typeof item.timestamp === "string" ? item.timestamp : undefined,
      geoValidated: typeof item.geoValidated === "boolean" ? item.geoValidated : undefined,
      deviceId: typeof item.deviceId === "string" ? item.deviceId : undefined,
      source: typeof item.source === "string" ? item.source : undefined,
    }));
  }, [employeeId]);

  return (
    <DynamicPage
      pageKey="hrms.attendance"
      fallback={<AttendanceList fetchAttendance={fetchAttendance} employeeId={employeeId} />}
    />
  );
}
