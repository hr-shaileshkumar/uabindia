"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { MasterDataManager } from "@/features/administration/components/MasterDataManager";

export default function MasterDataRoute() {
  return (
    <DynamicPage
      pageKey="administration.master-data"
      fallback={<MasterDataManager />}
      renderMode="auto"
    />
  );
}

