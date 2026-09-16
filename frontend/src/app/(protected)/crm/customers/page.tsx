"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import CustomersManager from "@/features/crm/components/CustomersManager";

export default function CRMCustomersPage() {
  return (
    <DynamicPage
      pageKey="crm.customers"
      fallback={<CustomersManager />}
      renderMode="auto"
    />
  );
}

