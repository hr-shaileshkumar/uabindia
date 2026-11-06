/**
 * Canonical Deep-Link Enterprise Routing.
 *
 * Implements standard Big Tech canonical URLs (Google Cloud, AWS, Salesforce, Stripe):
 * - Address bar accurately displays the active workspace route (/finance/journal-entries, /sales/orders, etc.)
 * - Deep-linkable URLs can be directly bookmarked, shared via email/Slack/WhatsApp
 * - Native browser history (Back / Forward) functions predictably
 * - Multi-tab workflows operate independently without state collision
 */

export const ACTIVE_PATH_COOKIE = "active_path";
export const ACTIVE_PATH_STORAGE = "erp.active.path";
export const DEFAULT_LOCKED_PATH = "/dashboard";

export const getEffectiveWorkspacePath = (currentPathname: string): string => {
  if (currentPathname && currentPathname !== "/") {
    return currentPathname;
  }
  return DEFAULT_LOCKED_PATH;
};

export const syncActiveWorkspacePath = (pathname: string, search: string = "") => {
  if (typeof window === "undefined") return;
  if (!pathname || pathname === "/") return;

  // Clean any redundant audience=platform query parameters from URL if present
  const cleanSearch = search
    .replace(/[?&]audience=platform(&|$)/, (m) => (m.startsWith("?") && m.endsWith("&") ? "?" : ""))
    .replace(/[?&]$/, "");
  const fullPath = pathname + cleanSearch;

  try {
    window.sessionStorage.setItem(ACTIVE_PATH_STORAGE, fullPath);
    // Expire/clear any legacy active_path cookie to prevent stale rewrite loops
    document.cookie = `${ACTIVE_PATH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // ignore
  }
};
