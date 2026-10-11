/**
 * WhatsApp-Style Single-Domain URL Lock Architecture.
 *
 * Keeps the browser address bar cleanly locked to the root domain (http://localhost:3000/)
 * while enabling smooth internal page views and navigation without exposing internal folder
 * paths or architecture in the browser URL bar.
 */

import { isProtectedWorkspacePath } from "@/lib/workspace/route-config";

export const ACTIVE_PATH_COOKIE = "active_path";
export const ACTIVE_PATH_STORAGE = "erp.active.path";
export const DEFAULT_LOCKED_PATH = "/dashboard";

export const getEffectiveWorkspacePath = (currentPathname: string): string => {
  if (currentPathname && currentPathname !== "/") {
    return currentPathname;
  }
  if (typeof window === "undefined") {
    return DEFAULT_LOCKED_PATH;
  }
  try {
    const stored = window.sessionStorage.getItem(ACTIVE_PATH_STORAGE);
    if (stored && stored.startsWith("/") && stored !== "/") {
      return stored;
    }
    const match = document.cookie.match(/(?:^|;\s*)active_path=([^;]+)/);
    if (match) {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.startsWith("/") && decoded !== "/") {
        return decoded;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_LOCKED_PATH;
};

export const syncActiveWorkspacePath = (pathname: string, search: string = "") => {
  if (typeof window === "undefined") return;
  if (!pathname || pathname === "/") return;

  // Clean any redundant audience=platform query parameters
  const cleanSearch = search
    .replace(/[?&]audience=platform(&|$)/, (m) => (m.startsWith("?") && m.endsWith("&") ? "?" : ""))
    .replace(/[?&]$/, "");
  const fullPath = pathname + cleanSearch;

  try {
    window.sessionStorage.setItem(ACTIVE_PATH_STORAGE, fullPath);
    document.cookie = `${ACTIVE_PATH_COOKIE}=${encodeURIComponent(fullPath)}; path=/; max-age=604800; SameSite=Lax`;
  } catch {
    // ignore
  }

  // Lock address bar strictly to root domain url (WhatsApp style: only domain URL, e.g. http://localhost:3000)
  const lockToRoot = () => {
    try {
      if (window.location.pathname !== "/") {
        window.history.replaceState(window.history.state, "", "/");
      }
    } catch {
      // ignore
    }
  };

  lockToRoot();
  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(lockToRoot);
  }
  setTimeout(lockToRoot, 50);
};
