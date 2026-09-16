"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { HrmsAssetsManager } from "@/features/hrms/components/HrmsAssetsManager";

export default function AssetsPage() {
  return (
    <DynamicPage
      pageKey="hrms.assets"
      fallback={<HrmsAssetsManager />}
      renderMode="auto"
    />
  );
}

