"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { UserPermissionManager } from "@/features/administration/components/UserPermissionManager";

export default function PermissionsPage() {
  return (
    <DynamicPage
      pageKey="administration.permissions"
      fallback={<UserPermissionManager />}
      renderMode="auto"
    />
  );
}

