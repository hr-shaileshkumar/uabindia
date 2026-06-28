import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerApiV1BaseUrl } from "@/lib/api-base-url";
import { AUTH_PATH_PREFIXES, BUSINESS_PATH_PREFIXES, OWNER_PATH_PREFIXES, matchesAnyPrefix } from "@/lib/erp/route-config";
import { isPlatformOnlyPath, TENANT_PUBLIC_HOME } from "@/lib/erp/public-routing";

const API_BASE_URL = getServerApiV1BaseUrl();
const PROTECTED_PREFIXES = [...BUSINESS_PATH_PREFIXES, ...OWNER_PATH_PREFIXES, "/context"];

const isLocalhost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";
const RESERVED_HOST_LABELS = new Set(["app", "api", "www"]);

const getSubdomain = (hostname: string) => {
  if (!hostname.endsWith(".localhost")) return null;
  const parts = hostname.split(".");
  const candidate = parts.length >= 2 ? parts[0] : null;
  if (!candidate) return null;
  if (RESERVED_HOST_LABELS.has(candidate)) return null;
  return candidate;
};

const matchesPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const resolveSafeNextPath = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (matchesAnyPrefix(value, AUTH_PATH_PREFIXES)) return null;
  return value;
};

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;
  const hasAccessToken = Boolean(request.cookies.get("access_token")?.value);

  if (pathname.startsWith("/tenant-not-found")) {
    return NextResponse.next();
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

  if (isLocalhost(hostname)) {
    return NextResponse.next();
  }

  if (hostname.endsWith(".localhost")) {
    const subdomain = getSubdomain(hostname);
    if (!subdomain) {
      return NextResponse.next();
    }

    if (pathname === "/" || isPlatformOnlyPath(pathname)) {
      return NextResponse.redirect(new URL(TENANT_PUBLIC_HOME, request.url));
    }

    try {
      const res = await fetch(`${API_BASE_URL}/tenants/resolve?subdomain=${encodeURIComponent(subdomain)}`);
      if (!res.ok) {
        return NextResponse.redirect(new URL("/tenant-not-found", request.url));
      }

      const data = await res.json();
      if (!data?.exists) {
        return NextResponse.redirect(new URL("/tenant-not-found", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/tenant-not-found", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|assets).*)"],
};
