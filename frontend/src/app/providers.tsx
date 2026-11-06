"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
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
          <TenantPublicRedirect />
          {children}
          <AppNotificationToast />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

