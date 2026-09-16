"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { TimesheetsManager } from "@/features/projects/components/TimesheetsManager";

export default function ProjectTimesheetsPage() {
  return (
    <DynamicPage
      pageKey="projects.timesheets"
      fallback={<TimesheetsManager />}
      renderMode="auto"
    />
  );
}

