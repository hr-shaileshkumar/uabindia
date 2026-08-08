"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { platformApi } from "@/services/modules/platform";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    // Dynamic tenant branding binding
    const loadTenantBranding = async () => {
      try {
        const res = await platformApi.adminSettings.get();
        if (res.data?.data) {
          const { themeColor, logoUrl } = res.data.data;
          if (themeColor) {
            document.documentElement.style.setProperty("--primary", themeColor);
          }
          if (logoUrl) {
            window.localStorage.setItem("erp.tenant.logoUrl", logoUrl);
          }
        }
      } catch {
        // Fallback silently if unauthenticated or on public routes
      }
    };
    void loadTenantBranding();
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
