"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import ProbationManager from "@/features/hrms/probation";

export default function ProbationPage() {
  return (
    <DynamicPage
      pageKey="hrms.probation"
      fallback={<ProbationManager />}
      renderMode="auto"
    />
  );
}

