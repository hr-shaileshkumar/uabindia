export type PublicAudience = "platform" | "tenant";
export type PublicAudienceSearchParamValue = string | string[] | null | undefined;

const AUDIENCE_QUERY_KEY = "audience";
const RESERVED_HOST_LABELS = new Set(["app", "api", "www"]);

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
  return normalizePublicAudience(requestedAudience) ?? (hasTenantContext ? "tenant" : "platform");
}

const readSearchParamValue = (value: PublicAudienceSearchParamValue): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

const normalizeHostname = (value: string | null | undefined): string => {
  const host = (value || "").trim().toLowerCase();
  if (!host) {
    return "";
  }

  if (host.startsWith("[")) {
    const closingBracketIndex = host.indexOf("]");
    return closingBracketIndex >= 0 ? host.slice(1, closingBracketIndex) : host;
  }

  return host.split(":")[0];
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
  const normalizedRequestedAudience = normalizePublicAudience(readSearchParamValue(requestedAudience));
  if (normalizedRequestedAudience) {
    return normalizedRequestedAudience === "tenant";
  }

  const queryTenant = readSearchParamValue(tenant)?.trim().toLowerCase();
  if (queryTenant) {
    return true;
  }

  const hostname = normalizeHostname(host);
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  if (hostname.endsWith(".localhost") && !isLocalhost) {
    return true;
  }

  if (!hostname || isLocalhost) {
    return false;
  }

  const parts = hostname.split(".").filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0];
    if (candidate && !RESERVED_HOST_LABELS.has(candidate)) {
      return true;
    }
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
  params.set(AUDIENCE_QUERY_KEY, audience);

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}
