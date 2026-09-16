"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import CrmLeadsManager from "@/features/crm/leads";

export default function CRMLeadsPage() {
  return (
    <DynamicPage
      pageKey="crm.leads"
      fallback={<CrmLeadsManager />}
    />
  );
}
