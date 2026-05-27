"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TenantConfigProvider } from "@/context/TenantConfigContext";
import { OrgContextProvider } from "@/context/OrgContext";
import { PermissionProvider } from "@/context/PermissionContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TenantConfigProvider>
        <OrgContextProvider>
          <PermissionProvider>{children}</PermissionProvider>
        </OrgContextProvider>
      </TenantConfigProvider>
    </AuthProvider>
  );
}
