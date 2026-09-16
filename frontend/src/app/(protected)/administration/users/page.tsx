"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { AdministrationUsersManager } from "@/features/administration/components/AdministrationUsersManager";

export default function UsersPage() {
  return (
    <DynamicPage
      pageKey="administration.users"
      fallback={<AdministrationUsersManager />}
    />
  );
}
