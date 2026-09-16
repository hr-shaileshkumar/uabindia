"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import StructuresManager from "@/features/payroll/structures";

export default function PayrollStructuresPage() {
  return (
    <DynamicPage
      pageKey="payroll.structures"
      fallback={<StructuresManager />}
      renderMode="auto"
    />
  );
}

