"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { syncActiveWorkspacePath } from "@/lib/workspace/url-lock";

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

    if (!pathname || pathname === "/") return;

    const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    syncActiveWorkspacePath(pathname, search);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Enterprise Route Sync Controller.
 * Ensures clean URL canonicalization while supporting deep-linkable, transparent browser routes.
 */
export default function UrlLockController() {
  return (
    <Suspense fallback={null}>
      <UrlLockInner />
    </Suspense>
  );
}
