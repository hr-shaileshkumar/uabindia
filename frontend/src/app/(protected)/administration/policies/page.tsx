"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import PolicyStudio from "@/features/administration/policies";

export default function PlatformPoliciesPage() {
  return (
    <DynamicPage
      pageKey="administration.policies"
      fallback={<PolicyStudio />}
      renderMode="auto"
    />
  );
}

