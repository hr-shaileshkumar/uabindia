"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { CrmContactsManager } from "@/features/crm/components/CrmContactsManager";

export default function CrmContactsPage() {
  return (
    <DynamicPage
      pageKey="crm.contacts"
      fallback={<CrmContactsManager />}
    />
  );
}
