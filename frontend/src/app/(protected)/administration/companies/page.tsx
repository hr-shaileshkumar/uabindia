"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { CompaniesManager } from "@/features/administration/components/CompaniesManager";

export default function CompaniesPage() {
  return (
    <DynamicPage
      pageKey="administration.companies"
      fallback={<CompaniesManager />}
      renderMode="auto"
    />
  );
}

