import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Unified API Client for ERP Frontend
 * Backend-authoritative: All auth, modules, permissions, context handled by backend
 * Frontend: Request/response interceptors, token management, error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const normalizedApiBase = API_BASE_URL.replace(/\/+$/, "");
const apiBaseUrl = normalizedApiBase ? `${normalizedApiBase}/api/v1` : "/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // HTTP-only cookies for refresh tokens
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

const getDeviceId = (): string => {
  if (typeof window === "undefined") return "server-device";
  let d = window.localStorage.getItem("deviceId");
  if (!d) {
    d = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem("deviceId", d);
  }
  return d;
};

const ensureCsrfToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const existing = getCookie("csrf_token");
  if (existing) return existing;

  try {
    await axios.get(`${apiBaseUrl}/auth/csrf-token`, { withCredentials: true });
    return getCookie("csrf_token");
  } catch {
    return null;
  }
};

export const getTenantSubdomain = (): string | null => {
  const tenantFromEnv = process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN || null;
  if (typeof window === "undefined") return tenantFromEnv;

  const hostname = window.location.hostname.toLowerCase();
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (hostname.endsWith(".localhost") && !isLocalhost) {
    return hostname.split(".")[0] || tenantFromEnv;
  }

  const queryTenant = new URLSearchParams(window.location.search).get("tenant");
  return queryTenant || tenantFromEnv;
};

const getTenantHeader = (): string | null => {
  return getTenantSubdomain();
};

const getContextHeaders = (): { companyId?: string; projectId?: string } => {
  if (typeof window === "undefined") return {};
  const companyId = window.localStorage.getItem("activeCompanyId") || undefined;
  const projectId = window.localStorage.getItem("activeProjectId") || undefined;
  return { companyId, projectId };
};




const shouldAttachOrgScopeHeaders = (url?: string): boolean => {
  if (!url) return false;
  const normalized = url.toLowerCase();
  const bypassPrefixes = [
    "/auth",
    "/modules",
    "/system",
    "/companies",
    "/projects",
    "/tenants",
    "/settings",
    "/platform",
    "/licensing",
    "/security",
  ];

  return !bypassPrefixes.some((prefix) => normalized.startsWith(prefix));
};

const shouldAttemptRefresh = (url?: string): boolean => {
  if (!url) return true;
  const normalized = url.toLowerCase();
  return !normalized.includes("/auth/login") &&
    !normalized.includes("/auth/refresh") &&
    !normalized.includes("/auth/logout");
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

  window.dispatchEvent(
    new CustomEvent("erp:api-error", {
      detail: {
        status,
        message,
        url: error.config?.url,
        method: error.config?.method,
      },
    })
  );
};

const requestRefreshToken = async (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = axios
    .post(
      `${apiBaseUrl}/auth/refresh`,
      { deviceId: getDeviceId() },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
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
    const method = (config.method || "get").toLowerCase();
    const isStateChanging = ["post", "put", "patch", "delete"].includes(method);
    const isCsrfEndpoint = typeof config.url === "string" && config.url.includes("/auth/csrf-token");

    const tenant = getTenantHeader();
    if (tenant) {
      config.headers = config.headers || {};
      config.headers["X-Tenant"] = tenant;
    }

    if (shouldAttachOrgScopeHeaders(config.url)) {
      const { companyId, projectId } = getContextHeaders();
      if (companyId) {
        config.headers = config.headers || {};
        config.headers["X-Company-Id"] = companyId;
        config.headers["company_id"] = companyId;
      }
      if (projectId) {
        config.headers = config.headers || {};
        config.headers["X-Project-Id"] = projectId;
        config.headers["project_id"] = projectId;
      }
    }

    // NOTE: do not auto-force includeDeleted/includeAllTenants on every GET.
    // Page-level screens control these toggles explicitly so UX state remains predictable.

    if (isStateChanging && !isCsrfEndpoint) {
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
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && shouldAttemptRefresh(originalRequest.url)) {
      originalRequest._retry = true;
      const refreshed = await requestRefreshToken();
      if (refreshed) {
        return apiClient(originalRequest);
      }

      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (!path.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }

    dispatchApiErrorEvent(error);
    return Promise.reject(error);
  }
);

export default apiClient;
