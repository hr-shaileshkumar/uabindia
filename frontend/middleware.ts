import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PROTECTED_PREFIXES = [
  "/erp",
  "/platform",
  "/licensing",
  "/security",
  "/context",
  "/dashboard",
  "/hrms",
  "/payroll",
  "/reports",
  "/notifications",
  "/documents",
  "/customers",
  "/vendors",
  "/items",
  "/sales-orders",
  "/purchase-orders",
  "/chart-of-accounts",
  "/journal-entries",
  "/payments",
  "/warehouses",
  "/stock-movements",
  "/approvals",
];
const AUTH_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

const isLocalhost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";

const getSubdomain = (hostname: string) => {
  if (!hostname.endsWith(".localhost")) return null;
  const parts = hostname.split(".");
  return parts.length > 2 ? parts[0] : parts[0];
};

const matchesPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const resolveSafeNextPath = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (matchesPrefix(value, AUTH_PREFIXES)) return null;
  return value;
};

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;
  const hasAccessToken = Boolean(request.cookies.get("access_token")?.value);

  if (pathname.startsWith("/tenant-not-found")) {
    return NextResponse.next();
  }

  if (matchesPrefix(pathname, AUTH_PREFIXES) && hasAccessToken) {
    const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath || "/context", request.url));
  }

  if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !hasAccessToken) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (isLocalhost(hostname)) {
    return NextResponse.next();
  }

  if (hostname.endsWith(".localhost")) {
    const subdomain = getSubdomain(hostname);
    if (!subdomain) {
      return NextResponse.redirect(new URL("/tenant-not-found", request.url));
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tenants/resolve?subdomain=${encodeURIComponent(subdomain)}`);
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
