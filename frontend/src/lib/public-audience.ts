import { hasTenantScopedHost, isLocalhostHostname, normalizeHostname } from "@/lib/tenant-host";

export type PublicAudience = "platform" | "tenant";
export type PublicAudienceSearchParamValue = string | string[] | null | undefined;

const AUDIENCE_QUERY_KEY = "audience";

const isAudienceScopedPath = (pathname: string) =>
  pathname === "/login" ||
  pathname === "/forgot-password" ||
  pathname === "/register" ||
  pathname === "/reset-password" ||
  pathname === "/otp-verification" ||
  pathname === "/about" ||
  pathname === "/careers" ||
  pathname === "/contact" ||
  pathname === "/products" ||
  pathname.startsWith("/products/") ||
  pathname === "/industries" ||
  pathname.startsWith("/industries/") ||
  pathname === "/pricing" ||
  pathname === "/resources" ||
  pathname === "/book-demo" ||
  pathname === "/help-support" ||
  pathname === "/privacy" ||
  pathname === "/terms";

export function normalizePublicAudience(value: string | null | undefined): PublicAudience | null {
  if (value === "platform" || value === "tenant") {
    return value;
  }

  return null;
}

export function resolvePublicAudience(
  requestedAudience: string | null | undefined,
  hasTenantContext: boolean
): PublicAudience {
  if (hasTenantContext) {
    return "tenant";
  }

  return normalizePublicAudience(requestedAudience) ?? "platform";
}

const readSearchParamValue = (value: PublicAudienceSearchParamValue): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export function hasPublicTenantContextForRequest({
  pathname: _pathname,
  host,
  requestedAudience,
  tenant,
}: {
  pathname: string;
  host?: string | null;
  requestedAudience?: PublicAudienceSearchParamValue;
  tenant?: PublicAudienceSearchParamValue;
}): boolean {
  const hostname = normalizeHostname(host);
  if (hostname && hasTenantScopedHost(hostname)) {
    return true;
  }

  const queryTenant = readSearchParamValue(tenant)?.trim().toLowerCase();
  if (queryTenant) {
    return true;
  }

  const normalizedRequestedAudience = normalizePublicAudience(readSearchParamValue(requestedAudience));
  if (normalizedRequestedAudience) {
    return normalizedRequestedAudience === "tenant";
  }

  return false;
}

export function resolvePublicAudienceFromRequest({
  pathname,
  host,
  requestedAudience,
  tenant,
}: {
  pathname: string;
  host?: string | null;
  requestedAudience?: PublicAudienceSearchParamValue;
  tenant?: PublicAudienceSearchParamValue;
}): PublicAudience {
  const hostname = normalizeHostname(host);
  if (hostname && hasTenantScopedHost(hostname)) {
    return "tenant";
  }

  const normalizedRequestedAudience = readSearchParamValue(requestedAudience);
  return resolvePublicAudience(
    normalizedRequestedAudience,
    hasPublicTenantContextForRequest({ pathname, host, requestedAudience, tenant })
  );
}

export function hasExplicitPublicTenantContext(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return hasPublicTenantContextForRequest({
    pathname: window.location.pathname,
    host: window.location.host,
    requestedAudience: params.get(AUDIENCE_QUERY_KEY),
    tenant: params.get("tenant"),
  });
}

export function withPublicAudience(href: string, audience: PublicAudience): string {
  if (!href.startsWith("/")) {
    return href;
  }

  const [pathAndQuery, hash = ""] = href.split("#");
  const [pathname, query = ""] = pathAndQuery.split("?");

  if (!isAudienceScopedPath(pathname)) {
    return href;
  }

  const params = new URLSearchParams(query);
  if (audience === "tenant") {
    params.set(AUDIENCE_QUERY_KEY, "tenant");
  } else {
    params.delete(AUDIENCE_QUERY_KEY);
  }

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}
