"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import FleetManager from "@/features/fleet/components/FleetManager";

export default function FleetPage() {
  return (
    <DynamicPage
      pageKey="assets.fleet"
      fallback={<FleetManager />}
      renderMode="auto"
    />
  );
}

