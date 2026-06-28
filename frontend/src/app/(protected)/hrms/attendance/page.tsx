"use client";

import { useCallback } from "react";
import AttendanceList from "@/features/hrms/components/AttendanceList";
import { hrApi } from "@/services/hrApi";

type AttendanceRecord = {
  id: string;
  date?: string;
  employeeName?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
};

export default function AttendancePage() {
  const fetchAttendance = useCallback(async (): Promise<AttendanceRecord[]> => {
    const response = await hrApi.hrms.attendance.list(1, 50);
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
      date: typeof item.date === "string" ? item.date : undefined,
      employeeName:
        typeof item.employeeName === "string"
          ? item.employeeName
          : typeof item.fullName === "string"
            ? item.fullName
            : undefined,
      status: typeof item.status === "string" ? item.status.toLowerCase() : undefined,
      checkIn: typeof item.checkIn === "string" ? item.checkIn : undefined,
      checkOut: typeof item.checkOut === "string" ? item.checkOut : undefined,
    }));
  }, []);

  return <AttendanceList fetchAttendance={fetchAttendance} />;
}
