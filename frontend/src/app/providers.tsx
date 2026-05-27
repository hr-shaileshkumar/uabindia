"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { TenantConfigProvider } from "@/context/TenantConfigContext";
import { OrgContextProvider } from "@/context/OrgContext";
import { PermissionProvider } from "@/context/PermissionContext";
import { UiSchemaProvider } from "@/context/UiSchemaContext";
import AppNotificationToast from "@/components/AppNotificationToast";
import { createQueryClient } from "@/lib/query-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantConfigProvider>
          <OrgContextProvider>
            <PermissionProvider>
              <UiSchemaProvider>
                {children}
                <AppNotificationToast />
              </UiSchemaProvider>
            </PermissionProvider>
          </OrgContextProvider>
        </TenantConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
