"use client";

import type { ReactNode } from "react";
import { TenantConfigProvider } from "@/context/TenantConfigContext";
import { OrgContextProvider } from "@/context/OrgContext";
import { PermissionProvider } from "@/context/PermissionContext";
import { UiSchemaProvider } from "@/context/UiSchemaContext";
import { LocalizationProvider } from "@/context/LocalizationContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { SignalRNotificationProvider } from "@/context/SignalRNotificationContext";

export function ProtectedProviders({ children }: { children: ReactNode }) {
  return (
    <TenantConfigProvider>
      <OrgContextProvider>
        <PermissionProvider>
          <UiSchemaProvider>
            <LocalizationProvider>
              <CurrencyProvider>
                <SignalRNotificationProvider>
                  {children}
                </SignalRNotificationProvider>
              </CurrencyProvider>
            </LocalizationProvider>
          </UiSchemaProvider>
        </PermissionProvider>
      </OrgContextProvider>
    </TenantConfigProvider>
  );
}
