"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { HierarchyPostingManager } from "@/features/administration/components/HierarchyPostingManager";

export default function GeographyHierarchyPage() {
  return (
    <DynamicPage
      pageKey="administration.geography-hierarchy"
      fallback={<HierarchyPostingManager />}
      renderMode="auto"
    />
  );
}

