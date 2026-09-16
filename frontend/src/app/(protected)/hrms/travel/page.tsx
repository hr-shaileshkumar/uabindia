"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import TravelManager from "@/features/hrms/travel";

export default function TravelPage() {
  return (
    <DynamicPage
      pageKey="hrms.travel"
      fallback={<TravelManager />}
    />
  );
}
