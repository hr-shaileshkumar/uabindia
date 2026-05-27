import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const isLocalhost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";

const getSubdomain = (hostname: string) => {
  if (!hostname.endsWith(".localhost")) return null;
  const parts = hostname.split(".");
  return parts.length > 2 ? parts[0] : parts[0];
};

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/tenant-not-found")) {
    return NextResponse.next();
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
