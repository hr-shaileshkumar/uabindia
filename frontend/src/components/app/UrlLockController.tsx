"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { syncActiveWorkspacePath } from "@/lib/workspace/url-lock";

import { isProtectedWorkspacePath } from "@/lib/workspace/route-config";

function UrlLockInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Sanitize any redundant ?audience=platform query parameters from visible browser bar
    if (searchParams?.get("audience") === "platform") {
      const url = new URL(window.location.href);
      url.searchParams.delete("audience");
      const cleanHref = url.pathname + (url.search ? url.search : "") + url.hash;
      window.history.replaceState(window.history.state, "", cleanHref);
    }

    // Only apply root single-domain lock to protected workspace routes (e.g. /dashboard, /employee-self-service)
    // NEVER lock public pages (/contact, /login, /careers, /about), so refresh (F5) and address bar double-tap work reliably!
    if (!pathname || pathname === "/" || !isProtectedWorkspacePath(pathname)) return;

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
