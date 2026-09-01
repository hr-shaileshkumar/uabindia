"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { TenantConfigProvider } from "@/context/TenantConfigContext";
import { OrgContextProvider } from "@/context/OrgContext";
import { PermissionProvider } from "@/context/PermissionContext";
import { UiSchemaProvider } from "@/context/UiSchemaContext";
import { SignalRNotificationProvider } from "@/context/SignalRNotificationContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LocalizationProvider } from "@/context/LocalizationContext";
import { I18nProvider } from "@/context/I18nContext";
import AppNotificationToast from "@/components/AppNotificationToast";
import { TenantPublicRedirect } from "@/components/public/TenantPublicRedirect";
import { createQueryClient } from "@/lib/query-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <TenantConfigProvider>
            <OrgContextProvider>
              <PermissionProvider>
                <UiSchemaProvider>
                  <LocalizationProvider>
                    <CurrencyProvider>
                      <SignalRNotificationProvider>
                        <TenantPublicRedirect />
                        {children}
                        <AppNotificationToast />
                      </SignalRNotificationProvider>
                    </CurrencyProvider>
                  </LocalizationProvider>
                </UiSchemaProvider>
              </PermissionProvider>
            </OrgContextProvider>
          </TenantConfigProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
