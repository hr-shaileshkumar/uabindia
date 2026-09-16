"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { AdministrationRolesManager } from "@/features/administration/components/AdministrationRolesManager";

export default function RolesPage() {
  return (
    <DynamicPage
      pageKey="administration.roles"
      fallback={<AdministrationRolesManager />}
    />
  );
}
