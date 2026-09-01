"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasExplicitPublicTenantContext } from "@/lib/public-audience";
import { isPlatformOnlyPath, TENANT_PUBLIC_HOME } from "@/lib/workspace/public-routing";

export function TenantPublicRedirect() {
  const router = useRouter();
  const pathname = usePathname() || "";

  useEffect(() => {
    if (!hasExplicitPublicTenantContext()) return;

    if (pathname === "/" || isPlatformOnlyPath(pathname)) {
      router.replace(TENANT_PUBLIC_HOME);
    }
  }, [pathname, router]);

  return null;
}
