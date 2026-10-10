"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { syncActiveWorkspacePath } from "@/lib/workspace/url-lock";

function UrlLockInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname === "/") return;
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    syncActiveWorkspacePath(pathname, search);
  }, [pathname, searchParams]);

  return null;
}

/**
 * WhatsApp-Style URL Lock Controller.
 * Masks and locks the browser address bar strictly to the base domain URL (http://localhost:3000),
 * hiding internal folder architecture and route references from the address bar.
 */
export default function UrlLockController() {
  return (
    <Suspense fallback={null}>
      <UrlLockInner />
    </Suspense>
  );
}
