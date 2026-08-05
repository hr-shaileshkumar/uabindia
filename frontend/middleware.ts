import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerApiV1BaseUrl } from "@/lib/api-base-url";
import { AUTH_PATH_PREFIXES, BUSINESS_PATH_PREFIXES, OWNER_PATH_PREFIXES, matchesAnyPrefix } from "@/lib/erp/route-config";
import { isPlatformOnlyPath, TENANT_PUBLIC_HOME } from "@/lib/erp/public-routing";
import { hasTenantScopedHost, isLocalhostHostname } from "@/lib/tenant-host";

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

/** Administration module merged into Platform — redirect old routes */
const ADMINISTRATION_REDIRECTS: [string, string][] = [
  ["/administration/approvals", "/platform/permissions"],
  ["/administration/notifications", "/platform/notification-templates"],
  ["/administration/documents", "/platform/backup"],
  ["/administration/profile", "/profile"],
  ["/administration", "/platform/settings"],
];

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;
  const hasAccessToken = Boolean(request.cookies.get("access_token")?.value);

  if (pathname.startsWith("/tenant-not-found")) {
    return NextResponse.next();
  }

  // ── Administration → Platform redirects (longest prefix first) ───────
  for (const [from, to] of ADMINISTRATION_REDIRECTS) {
    if (pathname === from || pathname.startsWith(from + "/")) {
      return NextResponse.redirect(new URL(to, request.url));
    }
  }

  if (matchesAnyPrefix(pathname, AUTH_PATH_PREFIXES) && hasAccessToken) {
    const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath || "/context", request.url));
  }

  if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !hasAccessToken) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${pathname}${request.nextUrl.search}`;
    const audience = matchesAnyPrefix(pathname, OWNER_PATH_PREFIXES) ? "platform" : "tenant";
    loginUrl.searchParams.set("next", nextPath);
    loginUrl.searchParams.set("audience", audience);
    return NextResponse.redirect(loginUrl);
  }

  if (isLocalhostHostname(hostname)) {
    return NextResponse.next();
  }

  if (hasTenantScopedHost(hostname)) {
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/resolve?host=${encodeURIComponent(hostname)}`, { cache: "no-store" });
      if (!res.ok) {
        return NextResponse.redirect(new URL("/tenant-not-found", request.url));
      }

      const data = await res.json();
      if (!data?.exists) {
        return NextResponse.redirect(new URL("/tenant-not-found", request.url));
      }

      if (pathname === "/" || isPlatformOnlyPath(pathname)) {
        return NextResponse.redirect(new URL(TENANT_PUBLIC_HOME, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/tenant-not-found", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)"],
};
