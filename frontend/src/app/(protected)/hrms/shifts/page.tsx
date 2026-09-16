"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { ShiftList } from "@/features/hrms/components/ShiftList";

export default function ShiftsRoute() {
  return (
    <DynamicPage
      pageKey="hrms.shifts"
      fallback={<ShiftList />}
      renderMode="auto"
    />
  );
}

