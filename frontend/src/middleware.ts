import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerApiV1BaseUrl } from "@/lib/api-base-url";
import {
  AUTH_PATH_PREFIXES,
  BUSINESS_PATH_PREFIXES,
  OWNER_PATH_PREFIXES,
  PUBLIC_PATH_PREFIXES,
  matchesAnyPrefix,
} from "@/lib/workspace/route-config";
import { isPlatformOnlyPath, TENANT_PUBLIC_HOME } from "@/lib/workspace/public-routing";
import { hasTenantScopedHost, isLocalhostHostname, normalizeHostname } from "@/lib/tenant-host";

const API_BASE_URL = getServerApiV1BaseUrl();
const PROTECTED_PREFIXES = [...BUSINESS_PATH_PREFIXES, ...OWNER_PATH_PREFIXES, "/context"];

const matchesPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const resolveSafeNextPath = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (matchesAnyPrefix(value, AUTH_PATH_PREFIXES)) return null;
  return value;
};

interface TenantHostCacheEntry {
  exists: boolean;
  timestamp: number;
}
const TENANT_CACHE_TTL_MS = 60_000;
const tenantHostCache = new Map<string, TenantHostCacheEntry>();

export async function middleware(request: NextRequest) {
  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.hostname;
  const hostname = normalizeHostname(rawHost);
  const pathname = request.nextUrl.pathname;
  const hasAccessToken = Boolean(request.cookies.get("access_token")?.value);
  const isLocal = isLocalhostHostname(hostname) || isLocalhostHostname(request.nextUrl.hostname);

  if (pathname.startsWith("/tenant-not-found")) {
    return NextResponse.next();
  }

  // ── Backward Compatibility: Redirect legacy /platform routes to /administration ──
  if (pathname === "/platform" || pathname.startsWith("/platform/")) {
    const suffix = pathname.slice("/platform".length);
    return NextResponse.redirect(new URL(`/administration${suffix}${request.nextUrl.search}`, request.url));
  }

  // ── Enterprise Canonical Route Redirects (Eliminates duplicate & unwanted folder pages) ──
  const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
    "/mss": "/manager-self-service",
    "/ess": "/employee-self-service",
    "/inventory/wms": "/inventory/warehouse-management",
    "/procurement/grn": "/procurement/goods-receipt-notes",
    "/administration/edi": "/administration/electronic-data-interchange",
    "/security/mfa": "/security/multi-factor-authentication",
    "/security/sso": "/security/single-sign-on",
    "/hrms/departments": "/administration/departments",
    "/hrms/designations": "/administration/designations",
    "/hrms/payroll": "/payroll/runs",
    "/assets": "/hrms/assets",
    "/sales/customers": "/crm/customers",
  };

  if (LEGACY_ROUTE_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(`${LEGACY_ROUTE_REDIRECTS[pathname]}${request.nextUrl.search}`, request.url));
  }

  if (matchesAnyPrefix(pathname, AUTH_PATH_PREFIXES) && hasAccessToken) {
    const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath || "/", request.url));
  }

  // ── Universal Single-Domain URL Lock: Root Routing & State Persistence ──
  // The browser address bar strictly displays ONLY the domain URL (http://localhost:3000).
  // All internal routes (/contact, /login, /dashboard, /careers, etc.) are served seamlessly via root rewrite.
  if (pathname === "/") {
    const rawActive = request.cookies.get("active_path")?.value;
    if (rawActive) {
      try {
        const decoded = decodeURIComponent(rawActive);
        if (decoded.startsWith("/") && !decoded.startsWith("//") && decoded !== "/") {
          // If active path is protected and user is not authenticated, rewrite to /login
          if (matchesPrefix(decoded, PROTECTED_PREFIXES) && !hasAccessToken) {
            return NextResponse.rewrite(new URL("/login", request.url));
          }
          // If active path is auth and user is already authenticated, rewrite to /dashboard
          if (matchesAnyPrefix(decoded, AUTH_PATH_PREFIXES) && hasAccessToken) {
            return NextResponse.rewrite(new URL("/dashboard", request.url));
          }
          return NextResponse.rewrite(new URL(decoded, request.url));
        }
      } catch {}
    }
    if (hasAccessToken) {
      return NextResponse.rewrite(new URL("/dashboard", request.url));
    }
    // Default public home
    return NextResponse.next();
  }

  // Clean redundant ?audience=platform query parameters from public URLs on platform/localhost
  if (!hasTenantScopedHost(hostname) && request.nextUrl.searchParams.get("audience") === "platform") {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete("audience");
    return NextResponse.redirect(cleanUrl);
  }

  // Normalize audience=platform to tenant on tenant-scoped hosts (e.g. uab.localhost:3000/login?audience=platform)
  if (hasTenantScopedHost(hostname) && matchesAnyPrefix(pathname, AUTH_PATH_PREFIXES)) {
    if (request.nextUrl.searchParams.get("audience") === "platform") {
      const normalizedUrl = new URL(request.url);
      normalizedUrl.searchParams.set("audience", "tenant");
      return NextResponse.redirect(normalizedUrl);
    }
  }

  if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !hasAccessToken) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${pathname}${request.nextUrl.search}`;
    const isTenantHost = hasTenantScopedHost(hostname);
    loginUrl.searchParams.set("next", nextPath);
    if (isTenantHost) {
      loginUrl.searchParams.set("audience", "tenant");
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isLocal) {
    return NextResponse.next();
  }

  if (hasTenantScopedHost(hostname)) {
    const cached = tenantHostCache.get(hostname);
    let exists = false;
    if (cached && Date.now() - cached.timestamp < TENANT_CACHE_TTL_MS) {
      exists = cached.exists;
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/tenants/resolve?host=${encodeURIComponent(hostname)}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          exists = Boolean(data?.exists);
          tenantHostCache.set(hostname, { exists, timestamp: Date.now() });
        } else {
          tenantHostCache.set(hostname, { exists: false, timestamp: Date.now() });
        }
      } catch {
        return NextResponse.redirect(new URL("/tenant-not-found", request.url));
      }
    }

    if (!exists) {
      return NextResponse.redirect(new URL("/tenant-not-found", request.url));
    }

    if (pathname === "/" || isPlatformOnlyPath(pathname)) {
      return NextResponse.redirect(new URL(TENANT_PUBLIC_HOME, request.url));
    }
  }

  // Generate CSP nonce and set security headers using Edge-compatible Web Crypto
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Nonce", nonce);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)"],
};
