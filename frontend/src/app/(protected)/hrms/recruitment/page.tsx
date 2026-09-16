"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import RecruitmentManager from "@/features/hrms/recruitment";

export default function RecruitmentAtsPage() {
  return (
    <DynamicPage
      pageKey="hrms.recruitment"
      fallback={<RecruitmentManager />}
      renderMode="auto"
    />
  );
}

