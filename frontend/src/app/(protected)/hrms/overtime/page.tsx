"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { OvertimeList } from "@/features/hrms/components/OvertimeList";

export default function OvertimeRoute() {
  return (
    <DynamicPage
      pageKey="hrms.overtime"
      fallback={<OvertimeList />}
      renderMode="auto"
    />
  );
}

