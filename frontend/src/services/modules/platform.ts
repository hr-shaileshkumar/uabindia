import apiClient from "@/services/apiClient";

export type WebsitePageSummary = {
  id: string;
  pageType: string;
  title: string;
  contentJson: string;
  isPublished: boolean;
  tenantId?: string;
  tenantName?: string;
};

export type WebsitePageTenantGroup = {
  tenant: string;
  pages: WebsitePageSummary[];
};

export type WebsitePagesResponse =
  | WebsitePageSummary[]
  | {
      tenants?: WebsitePageTenantGroup[];
    };

export const platformApi = {
  getTenants: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/tenants", { params }),
  getTenant: (id: string) => apiClient.get(`/tenants/${id}`),
  getProvisioningDashboard: () => apiClient.get("/tenants/provisioning/dashboard"),
  getCompanies: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/companies", { params }),
  getUsers: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/users", { params }),
  getRoles: () => apiClient.get("/roles"),
  getPermissions: () => apiClient.get("/permissions"),
  getSystemHealth: () => apiClient.get("/system/health"),
  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/auditlogs", { params }),
  getUiNavigation: () => apiClient.get("/ui-shell/navigation"),
  getUiDashboard: () => apiClient.get("/ui-shell/dashboard"),
  website: {
    listPages: () => apiClient.get<WebsitePagesResponse>("/website/pages"),
    updatePage: (pageType: string, payload: { title: string; contentJson: string; tenantId?: string }) =>
      apiClient.put<WebsitePageSummary>(`/website/pages/${pageType}`, payload),
    publishPage: (pageType: string, tenantId?: string) =>
      apiClient.post(`/website/pages/${pageType}/publish${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ""}`, {}),
    unpublishPage: (pageType: string, tenantId?: string) =>
      apiClient.post(`/website/pages/${pageType}/unpublish${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ""}`, {}),
  },
};
