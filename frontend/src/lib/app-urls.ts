import { isLocalhostHostname, normalizeHostname } from "@/lib/tenant-host";

export interface AppUrlConfig {
  subdomain: string;
  path: string;
  isStandalonePortal?: boolean;
}

/**
 * Enterprise URL Resolver for Multi-Tenant & Multi-App UabIndia Suite.
 * Seamlessly resolves URLs across Localhost (:3000, :5173) and Production (erp.uabindia.in, hrms.uabindia.in).
 */
export function resolveAppSuiteUrl(config: AppUrlConfig, ssoToken?: string | null): string {
  const { subdomain, path, isStandalonePortal } = config;

  if (typeof window === "undefined") {
    return path;
  }

  const hostname = normalizeHostname(window.location.hostname);
  const isLocal = isLocalhostHostname(hostname) || hostname === "localhost" || hostname === "127.0.0.1";

  // 1. LOCAL DEVELOPMENT RESOLVER
  if (isLocal) {
    if (subdomain === "hrms" && isStandalonePortal) {
      // Standalone HRMS Vite React dev server on port 5173
      const tokenParam = ssoToken ? `?sso_token=${encodeURIComponent(ssoToken)}` : "";
      return `http://localhost:5173${path}${tokenParam}`;
    }

    // Default ERP Next.js dev server on port 3000
    return path;
  }

  // 2. PRODUCTION MULTI-TENANT RESOLVER
  // Check if current user is on a dedicated tenant subdomain (e.g. bharatprecision.uabindia.in)
  const parts = hostname.split(".");
  const isTenantSubdomain = parts.length >= 3 && !["erp", "hrms", "api", "app", "www"].includes(parts[0]);

  if (isTenantSubdomain) {
    // Model B: Path-based within client subdomain (e.g. bharat.uabindia.in/hrms)
    if (subdomain === "hrms" && isStandalonePortal) {
      return `/hrms${path === "/" ? "" : path}`;
    }
    return path;
  }

  // Model A: Google/Microsoft Multi-Subdomain Model
  // erp.uabindia.in, hrms.uabindia.in
  const protocol = window.location.protocol;
  const rootDomain = parts.slice(-2).join("."); // e.g. uabindia.in

  if (subdomain === "hrms" && isStandalonePortal) {
    return `${protocol}//hrms.${rootDomain}${path}`;
  }

  return `${protocol}//erp.${rootDomain}${path}`;
}

