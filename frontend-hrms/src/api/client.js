import axios from "axios";

// Configured backend URL or default to same-origin /api/v1 (proxied via Vite or direct)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL.replace(/\/+$/, "")}/api/v1` : "/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getStoredTenant = () => {
  if (typeof window === "undefined") return "erp";
  const stored = localStorage.getItem("hrms_tenant");
  // Normalize legacy demo or invalid values to actual tenant 'erp'
  if (!stored || stored === "demo" || stored === "uabindia-enterprise") {
    return "erp";
  }
  return stored;
};

export const setStoredTenant = (tenant) => {
  if (typeof window === "undefined") return;
  const normalized = (!tenant || tenant === "demo" || tenant === "uabindia-enterprise") ? "erp" : tenant;
  localStorage.setItem("hrms_tenant", normalized);
  window.dispatchEvent(new Event("tenant_changed"));
};

export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hrms_token");
};

export const getStoredCompanyId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hrms_company_id") || localStorage.getItem("activeCompanyId");
};

export const setStoredCompanyId = (companyId) => {
  if (typeof window === "undefined") return;
  if (companyId) {
    localStorage.setItem("hrms_company_id", companyId);
    localStorage.setItem("activeCompanyId", companyId);
  } else {
    localStorage.removeItem("hrms_company_id");
    localStorage.removeItem("activeCompanyId");
  }
};

export const setStoredToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("hrms_token", token);
    // Also set access_token cookie for any browser components
    document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    localStorage.removeItem("hrms_token");
    document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax`;
  }
};

// Request interceptor to attach JWT token, tenant headers, and normalize API URLs
apiClient.interceptors.request.use(
  (config) => {
    // Normalize URL: avoid duplicate /api/v1 if caller passed /api/v1/xyz
    if (config.url) {
      if (config.url.startsWith("/api/v1/")) {
        config.url = config.url.slice(7);
      } else if (config.url.startsWith("api/v1/")) {
        config.url = "/" + config.url.slice(7);
      }
      if (!config.url.startsWith("/")) {
        config.url = `/${config.url}`;
      }
    }

    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantSubdomain = getStoredTenant();
    if (tenantSubdomain) {
      config.headers["X-Tenant-Subdomain"] = tenantSubdomain;
      config.headers["X-Tenant"] = tenantSubdomain;
    }

    const companyId = getStoredCompanyId();
    if (companyId) {
      config.headers["X-Company-Id"] = companyId;
    }

    const projectId = localStorage.getItem("hrms_project_id") || localStorage.getItem("activeProjectId");
    if (projectId) {
      config.headers["X-Project-Id"] = projectId;
    }

    let deviceId = localStorage.getItem("hrms_device_id");
    if (!deviceId) {
      deviceId = `hrms-client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("hrms_device_id", deviceId);
    }
    config.headers["X-Device-Id"] = deviceId;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 unauthorized & expired tokens
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname.startsWith("/login");
      if (!isAuthRoute) {
        setStoredToken(null);
        localStorage.removeItem("hrms_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
