import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { getClientApiV1BaseUrl } from "@/lib/api-base-url";
import { withPublicAudience } from "@/lib/public-audience";
import { OWNER_PATH_PREFIXES, matchesAnyPrefix } from "@/lib/workspace/route-config";
import { getTenantSubdomainFromHost, isLocalhostHostname, isPotentialCustomTenantHost } from "@/lib/tenant-host";

/**
 * Unified API Client for ERP Frontend
 * Backend-authoritative: All auth, modules, permissions, context handled by backend
 * Frontend: Request/response interceptors, token management, error handling
 */

const apiBaseUrl = getClientApiV1BaseUrl();
const TENANT_STORAGE_KEY = "erp.tenant.subdomain";
const RESERVED_TENANT_LABELS = new Set(["app", "www"]);

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // HTTP-only cookies for refresh tokens
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "server-device";
  let d = window.localStorage.getItem("deviceId");
  if (!d) {
    d = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem("deviceId", d);
  }
  return d;
};

let csrfPromise: Promise<string | null> | null = null;

export const setClientAuthToken = (token: string | null) => {
  if (typeof document !== "undefined") {
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    const secureFlag = isSecure ? "; Secure" : "";
    if (token) {
      document.cookie = `access_token=${token}; path=/; max-age=900; SameSite=Lax${secureFlag}`;
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }
};

// Initialize Authorization header from existing cookie on startup
if (typeof document !== "undefined") {
  const existingToken = getCookie("access_token");
  if (existingToken) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${existingToken}`;
  }
}

const ensureCsrfToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const existing = getCookie("csrf_token");
  if (existing) return existing;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const tenant = getTenantHeader();
      await axios.get(`${apiBaseUrl}/auth/csrf-token`, {
        withCredentials: true,
        headers: tenant ? { "X-Tenant": tenant } : undefined,
      });
      return getCookie("csrf_token");
    } catch {
      return null;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
};

export const persistTenantSubdomain = (tenant: string | null | undefined) => {
  if (typeof window === "undefined") return;
  const normalized = normalizeTenantSubdomain(tenant);
  if (!normalized) {
    window.localStorage.removeItem(TENANT_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("erp:tenant-changed", { detail: { subdomain: null } })
    );
    return;
  }

  window.localStorage.setItem(TENANT_STORAGE_KEY, normalized);
  window.dispatchEvent(
    new CustomEvent("erp:tenant-changed", { detail: { subdomain: normalized } })
  );
};

export const clearTenantSubdomain = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TENANT_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("erp:tenant-changed", { detail: { subdomain: null } })
  );
};

export const getTenantSubdomain = (): string | null => {
  const tenantFromEnv = normalizeTenantSubdomain(process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN || null);
  if (typeof window === "undefined") return tenantFromEnv;

  const hostname = window.location.hostname.toLowerCase();
  const queryTenant = normalizeTenantSubdomain(new URLSearchParams(window.location.search).get("tenant"));
  const tenantFromHost = normalizeTenantSubdomain(getTenantSubdomainFromHost(hostname));

  if (tenantFromHost) {
    return tenantFromHost;
  }

  if (queryTenant) {
    return queryTenant;
  }

  const storedTenant = normalizeTenantSubdomain(window.localStorage.getItem(TENANT_STORAGE_KEY));
  if (storedTenant) {
    return storedTenant;
  }

  return tenantFromEnv;
};

const getTenantHeader = (): string | null => {
  const tenant = getTenantSubdomain();
  if (tenant) {
    return tenant;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();
  return isPotentialCustomTenantHost(hostname) ? hostname : null;
};

const normalizeTenantSubdomain = (value: string | null | undefined): string | null => {
  const normalized = value?.trim().toLowerCase() || null;
  if (!normalized || RESERVED_TENANT_LABELS.has(normalized)) {
    return null;
  }

  return normalized;
};

const getContextHeaders = (): { companyId?: string; projectId?: string; financialYearKey?: string } => {
  if (typeof window === "undefined") return {};
  const companyId = window.localStorage.getItem("activeCompanyId") || undefined;
  const projectId = window.localStorage.getItem("activeProjectId") || undefined;
  const financialYearKey = window.localStorage.getItem("activeFinancialYearKey") || undefined;
  return { companyId, projectId, financialYearKey };
};




const shouldAttachOrgScopeHeaders = (url?: string): boolean => {
  if (!url) return false;
  let normalized = url.toLowerCase();
  try {
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      const u = new URL(normalized);
      normalized = u.pathname;
    }
  } catch {
    // ignore
  }
  normalized = normalized.replace(/^\/+/, "");
  if (normalized.startsWith("api/v1/")) normalized = normalized.slice(7);
  else if (normalized.startsWith("api/")) normalized = normalized.slice(4);

  const bypassPrefixes = [
    "auth",
    "public",
    "modules",
    "system",
    "companies",
    "tenants",
    "dynamic-entities/tenant",
    "dynamic-entities/tenants",
    "ui-pages",
    "org-context",
    "settings",
    "platform",
    "superadmin",
    "licensing",
    "security",
  ];

  return !bypassPrefixes.some((prefix) => normalized.startsWith(prefix));
};

const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;
  let normalized = url.toLowerCase().replace(/^\/+/, "");
  if (normalized.startsWith("api/v1/")) normalized = normalized.slice(7);
  else if (normalized.startsWith("api/")) normalized = normalized.slice(4);

  return (
    normalized.startsWith("auth/") ||
    normalized.startsWith("iam/auth/") ||
    normalized === "auth"
  );
};

const isCsrfExempt = (url?: string): boolean => {
  if (!url) return false;
  let normalized = url.toLowerCase().replace(/^\/+/, "");
  if (normalized.startsWith("api/v1/")) normalized = normalized.slice(7);
  else if (normalized.startsWith("api/")) normalized = normalized.slice(4);

  return (
    normalized.startsWith("auth/login") ||
    normalized.startsWith("auth/refresh") ||
    normalized.startsWith("auth/csrf-token") ||
    normalized.startsWith("auth/logout") ||
    normalized.startsWith("auth/forgot-password") ||
    normalized.startsWith("auth/reset-password") ||
    normalized.startsWith("iam/auth/") ||
    normalized.startsWith("public/") ||
    normalized.startsWith("tenants/resolve") ||
    normalized.startsWith("health")
  );
};

const shouldAttemptRefresh = (url?: string): boolean => {
  if (!url) return false;
  let normalized = url.toLowerCase().replace(/^\/+/, "");
  if (normalized.startsWith("api/v1/")) normalized = normalized.slice(7);
  else if (normalized.startsWith("api/")) normalized = normalized.slice(4);

  return (
    !normalized.startsWith("auth/login") &&
    !normalized.startsWith("auth/refresh") &&
    !normalized.startsWith("auth/logout") &&
    !normalized.startsWith("auth/forgot-password") &&
    !normalized.startsWith("auth/reset-password") &&
    !normalized.startsWith("iam/auth/") &&
    !normalized.startsWith("public/")
  );
};

const dispatchApiErrorEvent = (error: AxiosError) => {
  if (typeof window === "undefined") return;
  const silentHeader = error.config?.headers?.["X-Silent-Error"];
  if (silentHeader === "1" || silentHeader === 1 || silentHeader === true) {
    return;
  }
  const status = error.response?.status ?? 0;
  const responseData = error.response?.data as { message?: string } | undefined;
  const message = responseData?.message || error.message || "Unexpected API error";
  const correlationId = (error.response?.headers?.["x-correlation-id"] || error.config?.headers?.["X-Correlation-Id"]) as string | undefined;

  window.dispatchEvent(
    new CustomEvent("erp:api-error", {
      detail: {
        status,
        message,
        url: error.config?.url,
        method: error.config?.method,
        correlationId,
      },
    })
  );

  // Automatically bridge unhandled API errors to user-facing toast notifications
  const title =
    status >= 500
      ? "Server Error"
      : status === 403
      ? "Access Denied"
      : status === 429
      ? "Rate Limit Exceeded"
      : "Request Failed";

  window.dispatchEvent(
    new CustomEvent("erp:notify", {
      detail: {
        variant: "error",
        title,
        message,
        correlationId,
      },
    })
  );
};

const requestRefreshToken = async (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  const tenant = getTenantHeader();
  refreshPromise = axios
    .post(
      `${apiBaseUrl}/auth/refresh`,
      { deviceId: getDeviceId() },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          ...(tenant ? { "X-Tenant": tenant } : {}),
        },
      }
    )
    .then((res) => res.status === 200)
    .catch(() => false)
    .finally(() => {
      isRefreshing = false;
    });

  return refreshPromise;
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Prevent duplicate /api/v1 prefix when calling with explicit /api/v1 paths
    if (typeof config.url === "string") {
      if (config.url.startsWith("/api/v1/")) {
        config.url = config.url.slice(8);
      } else if (config.url.startsWith("api/v1/")) {
        config.url = config.url.slice(7);
      } else if (config.url.startsWith("/") && !config.url.startsWith("//")) {
        config.url = config.url.slice(1);
      }
    }

    const method = (config.method || "get").toLowerCase();
    const isStateChanging = ["post", "put", "patch", "delete"].includes(method);
    const isCsrfEndpoint = typeof config.url === "string" && config.url.includes("/auth/csrf-token");

    // Standard correlation ID for distributed enterprise request tracing
    config.headers = config.headers || {};
    if (!config.headers["X-Correlation-Id"]) {
      config.headers["X-Correlation-Id"] = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const tenant = getTenantHeader();
    const urlStr = typeof config.url === "string" ? config.url.toLowerCase() : "";
    const isGlobalTenantBypass =
      urlStr.startsWith("superadmin/") ||
      urlStr.startsWith("/superadmin/") ||
      urlStr.startsWith("tenants/resolve") ||
      urlStr.startsWith("/tenants/resolve") ||
      urlStr.startsWith("tenants") ||
      urlStr.startsWith("/tenants");

    if (tenant && !isGlobalTenantBypass) {
      config.headers = config.headers || {};
      config.headers["X-Tenant"] = tenant;
    }

    if (shouldAttachOrgScopeHeaders(config.url)) {
      const { companyId, projectId, financialYearKey } = getContextHeaders();
      if (companyId) {
        config.headers = config.headers || {};
        config.headers["X-Company-Id"] = companyId;
        config.headers["company_id"] = companyId;
        if (config.method === "get") {
          config.params = config.params || {};
          if (config.params.companyId === undefined && config.params.company_id === undefined) {
            config.params.companyId = companyId;
          }
        }
      }
      if (projectId) {
        config.headers = config.headers || {};
        config.headers["X-Project-Id"] = projectId;
        config.headers["project_id"] = projectId;
        if (config.method === "get") {
          config.params = config.params || {};
          if (config.params.projectId === undefined && config.params.project_id === undefined) {
            config.params.projectId = projectId;
          }
        }
      }
      if (financialYearKey && financialYearKey !== "all") {
        config.headers = config.headers || {};
        config.headers["X-Financial-Year"] = financialYearKey;
        if (config.method === "get") {
          config.params = config.params || {};
          if (config.params.financialYear === undefined && config.params.financialYearKey === undefined) {
            config.params.financialYear = financialYearKey;
          }
        }
      }

      if (isStateChanging && !companyId) {
        const flagshipNeedCompany =
          typeof config.url === "string" &&
          /\/(employees|customers|leads|salesorders|salesquotations|salesinvoices|expenses|grn|stockmovements|journalentries|payments|purchaseorders|purchaserequests|vendors|items|warehouses|bank-reconciliations|payroll|attendance|leave|documents)\b/i.test(
            config.url,
          );
        if (flagshipNeedCompany) {
          return Promise.reject(
            new AxiosError(
              "Select a company in the workspace switcher before saving.",
              "ERR_ORG_SCOPE",
              config,
            ),
          );
        }
      }
    }

    // NOTE: do not auto-force includeDeleted/includeAllTenants on every GET.
    // Page-level screens control these toggles explicitly so UX state remains predictable.

    const hasBearer = Boolean(
      config.headers?.Authorization ||
      apiClient.defaults.headers.common["Authorization"]
    );

    if (isStateChanging && !isCsrfExempt(config.url) && !hasBearer) {
      const token = await ensureCsrfToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers["X-CSRF-Token"] = token;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    // If auth login or refresh succeeded, synchronize the client token immediately
    const url = typeof response.config?.url === "string" ? response.config.url.toLowerCase() : "";
    if (url.includes("auth/login") || url.includes("auth/refresh")) {
      const token = response.data?.access_token || response.data?.token;
      if (token) {
        setClientAuthToken(token);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const connectionCode = (error.code || "").toUpperCase();
    const isConnectionDrop =
      !error.response &&
      (connectionCode === "ERR_NETWORK" ||
        connectionCode === "ECONNREFUSED" ||
        connectionCode === "ECONNRESET" ||
        connectionCode === "ECONNABORTED" ||
        connectionCode === "ETIMEDOUT");

    if (
      !isConnectionDrop &&
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      shouldAttemptRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;
      const refreshed = await requestRefreshToken();
      if (refreshed) {
        return apiClient(originalRequest);
      }

      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (!path.startsWith("/login")) {
          const audience = matchesAnyPrefix(path, OWNER_PATH_PREFIXES) ? "platform" : "tenant";
          window.location.href = withPublicAudience("/login", audience);
        }
      }
    }

    dispatchApiErrorEvent(error);
    return Promise.reject(error);
  }
);

export default apiClient;
