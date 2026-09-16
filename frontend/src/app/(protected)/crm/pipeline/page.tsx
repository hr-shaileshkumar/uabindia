"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { CrmPipelineManager } from "@/features/crm/components/CrmPipelineManager";

export default function CrmPipelinePage() {
  return (
    <DynamicPage
      pageKey="crm.pipeline"
      fallback={<CrmPipelineManager />}
    />
  );
}
