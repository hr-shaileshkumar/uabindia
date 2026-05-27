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

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
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

const getTenantHeader = (): string | null => {
  const tenant = process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN || null;
  if (typeof window === "undefined") return tenant;

  const hostname = window.location.hostname.toLowerCase();
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (hostname.endsWith(".localhost") && !isLocalhost) {
    return hostname.split(".")[0] || null;
  }

  return isLocalhost ? tenant : null;
};

const getContextHeaders = (): { companyId?: string; projectId?: string } => {
  if (typeof window === "undefined") return {};
  const companyId = window.localStorage.getItem("activeCompanyId") || undefined;
  const projectId = window.localStorage.getItem("activeProjectId") || undefined;
  return { companyId, projectId };
};

// Request interceptor: no token injection (HttpOnly cookies only)
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

    const { companyId, projectId } = getContextHeaders();
    if (companyId) {
      config.headers = config.headers || {};
      config.headers["X-Company-Id"] = companyId;
    }
    if (projectId) {
      config.headers = config.headers || {};
      config.headers["X-Project-Id"] = projectId;
    }

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

// Response interceptor: Handle 401 Unauthorized (token expired/invalid)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token invalid/expired - redirect to login unless already there
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (!path.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
