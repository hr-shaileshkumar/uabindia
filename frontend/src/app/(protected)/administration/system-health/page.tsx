"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { SystemHealthDashboard } from "@/features/administration/components/SystemHealthDashboard";

export default function SystemHealthPage() {
  return (
    <DynamicPage
      pageKey="administration.system-health"
      fallback={<SystemHealthDashboard />}
      renderMode="auto"
    />
  );
}

