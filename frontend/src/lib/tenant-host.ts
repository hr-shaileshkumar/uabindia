const RESERVED_HOST_LABELS = new Set(["app", "api", "www"]);
const LOCALHOST_RESERVED_HOST_LABELS = new Set(["app", "www"]);
const RESERVED_PLATFORM_HOST_LABELS = new Set(["app", "api"]);
const DEFAULT_PLATFORM_SITE_URL = "https://www.uabindia.in";

export const normalizeHostname = (value: string | null | undefined): string => {
  const host = (value || "").trim().toLowerCase();
  if (!host) {
    return "";
  }

  if (host.startsWith("[")) {
    const closingBracketIndex = host.indexOf("]");
    return closingBracketIndex >= 0 ? host.slice(1, closingBracketIndex) : host;
  }

  // IPv6 address without port brackets (e.g. "::1" or "fe80::1")
  if (host.includes(":") && (host.match(/:/g) || []).length > 1) {
    return host;
  }

  return host.split(":")[0];
};

const stripLeadingWww = (value: string): string =>
  value.startsWith("www.") ? value.slice(4) : value;

const readPlatformHostname = (): string => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_PLATFORM_SITE_URL;

  try {
    const value = configured.includes("://") ? configured : `https://${configured}`;
    return new URL(value).hostname.toLowerCase();
  } catch {
    return normalizeHostname(configured);
  }
};

const PLATFORM_HOSTNAME = readPlatformHostname();
const PLATFORM_HOSTNAME_VARIANTS = new Set(
  [PLATFORM_HOSTNAME, stripLeadingWww(PLATFORM_HOSTNAME), `www.${stripLeadingWww(PLATFORM_HOSTNAME)}`]
    .map((value) => normalizeHostname(value))
    .filter(Boolean)
);

export const isBareLocalhost = (hostname: string): boolean => {
  const norm = normalizeHostname(hostname);
  return (
    norm === "localhost" ||
    norm === "127.0.0.1" ||
    norm === "::1" ||
    norm === "0.0.0.0"
  );
};

export const isLocalhostHostname = (hostname: string): boolean => {
  const norm = normalizeHostname(hostname);
  return isBareLocalhost(norm) || norm.endsWith(".localhost");
};

const isIpAddress = (hostname: string): boolean =>
  /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");

const isReservedTenantLabel = (label: string, hostname: string): boolean => {
  if (hostname.endsWith(".localhost")) {
    return LOCALHOST_RESERVED_HOST_LABELS.has(label);
  }

  return RESERVED_HOST_LABELS.has(label);
};

export const getTenantSubdomainFromHost = (value: string | null | undefined): string | null => {
  const hostname = normalizeHostname(value);
  if (!hostname || isBareLocalhost(hostname) || isIpAddress(hostname)) {
    return null;
  }

  if (hostname.endsWith(".localhost")) {
    const candidate = hostname.split(".")[0] || null;
    if (!candidate || isReservedTenantLabel(candidate, hostname)) {
      return null;
    }

    return candidate;
  }

  const parts = hostname.split(".").filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0];
    if (candidate && !isReservedTenantLabel(candidate, hostname)) {
      return candidate;
    }
  }

  return null;
};

export const isPlatformHostname = (value: string | null | undefined): boolean => {
  const hostname = normalizeHostname(value);
  if (!hostname) {
    return false;
  }

  return PLATFORM_HOSTNAME_VARIANTS.has(hostname) || PLATFORM_HOSTNAME_VARIANTS.has(stripLeadingWww(hostname));
};

export const isPotentialCustomTenantHost = (value: string | null | undefined): boolean => {
  const hostname = normalizeHostname(value);
  if (!hostname || isLocalhostHostname(hostname)) {
    return false;
  }

  if (getTenantSubdomainFromHost(hostname) || isPlatformHostname(hostname)) {
    return false;
  }

  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) {
    return false;
  }

  return !(parts.length >= 3 && RESERVED_PLATFORM_HOST_LABELS.has(parts[0] || ""));
};

export const hasTenantScopedHost = (value: string | null | undefined): boolean => {
  const hostname = normalizeHostname(value);
  return Boolean(hostname) && (Boolean(getTenantSubdomainFromHost(hostname)) || isPotentialCustomTenantHost(hostname));
};

export const getPlatformBaseDomain = (): string => {
  return stripLeadingWww(PLATFORM_HOSTNAME);
};

/**
 * Dynamically resolves the active root platform domain based on the runtime environment.
 * Adapts in real-time to:
 * - Local development: "localhost:3000" or "localhost"
 * - Customer private cloud / IP addresses: "192.168.1.10:3000", "20.55.10.12"
 * - Production / Staging custom domains: extracts apex root domain from active window.location
 */
export const getActiveSystemBaseDomain = (): string => {
  if (typeof window !== "undefined" && window.location) {
    const hostname = (window.location.hostname || "").toLowerCase().trim();
    const port = window.location.port;

    if (!hostname) {
      return getPlatformBaseDomain();
    }

    // Bare localhost or loopback (e.g. "localhost", "127.0.0.1")
    if (isBareLocalhost(hostname)) {
      return port ? `localhost:${port}` : "localhost";
    }

    // Tenant subdomain on localhost (e.g. "erp.localhost:3000")
    if (hostname.endsWith(".localhost")) {
      return port ? `localhost:${port}` : "localhost";
    }

    // Direct IP address hosting (e.g. "192.168.1.100:3000" or cloud public IP)
    if (isIpAddress(hostname)) {
      return window.location.host;
    }

    // Multi-tenant subdomain (e.g. "erp.uabindia.com" -> base is "uabindia.com")
    const parts = hostname.split(".").filter(Boolean);
    if (parts.length >= 3) {
      return parts.slice(1).join(".");
    }

    return hostname;
  }

  // SSR or non-browser fallback: check environment variables or configured site URL
  if (process.env.NEXT_PUBLIC_BASE_DOMAIN) {
    return process.env.NEXT_PUBLIC_BASE_DOMAIN.replace(/^\.+/, "").trim();
  }

  return getPlatformBaseDomain();
};

/**
 * Resolves the complete display domain for any tenant record.
 * Prioritizes:
 * 1. Verified Custom Domain (e.g. "erp.acmecorp.com")
 * 2. Dynamic subdomain on active platform host (e.g. "erp.localhost:3000", "erp.mycompany.in")
 */
export const resolveTenantDisplayDomain = (tenant: {
  subdomain?: string | null;
  customDomain?: string | null;
  domain?: string | null;
}): { domain: string; isCustom: boolean } => {
  const custom = (tenant.customDomain || tenant.domain || "").trim();
  if (custom) {
    return { domain: custom, isCustom: true };
  }

  const sub = (tenant.subdomain || "").trim();
  const base = getActiveSystemBaseDomain();

  if (!sub) {
    return { domain: base, isCustom: false };
  }

  return { domain: `${sub}.${base}`, isCustom: false };
};
