"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { SupportCenterManager } from "@/features/administration/components/SupportCenterManager";

export default function SupportRoute() {
  return (
    <DynamicPage
      pageKey="administration.support"
      fallback={<SupportCenterManager />}
      renderMode="auto"
    />
  );
}

