"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { FieldServiceManager } from "@/features/field-service/components/FieldServiceManager";

export default function FieldServicePage() {
  return (
    <DynamicPage
      pageKey="projects.field-service"
      fallback={<FieldServiceManager />}
      renderMode="auto"
    />
  );
}

