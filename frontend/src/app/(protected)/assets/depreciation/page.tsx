"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { AssetDepreciationManager } from "@/features/assets/components/AssetDepreciationManager";

export default function FixedAssetDepreciationPage() {
  return (
    <DynamicPage
      pageKey="assets.depreciation"
      fallback={<AssetDepreciationManager />}
      renderMode="auto"
    />
  );
}

