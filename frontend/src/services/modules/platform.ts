import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

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
  admin: {
    tenants: (includeDeleted?: boolean) =>
      apiClient.get(`/tenants${includeDeleted ? "?includeDeleted=true" : ""}`, { headers: { "X-Silent-Error": "1" } }),
    createTenant: (data: {
      tenantProvisionRequestId?: string;
      name: string;
      subdomain: string;
      adminEmail: string;
      adminName: string;
      adminRole: "Admin" | "SuperAdmin";
      adminPassword?: string;
      sendInviteLink?: boolean;
      subscriptionPlan: string;
      status: "active" | "inactive" | "suspended" | "trial";
      selectedModules: string[];
      address?: string;
      state?: string;
      district?: string;
      pincode?: string;
      contactNumber?: string;
      gstNumber?: string;
      panNumber?: string;
      logoUrl?: string;
      timezone?: string;
      currency?: string;
      language?: string;
      billingStartDate?: string;
      billingEndDate?: string;
      trialExpiryDate?: string;
      employeeLimit?: number;
      storageLimitGb?: number;
      smsCredits?: number;
      whatsAppIntegrationEnabled?: boolean;
      smtpHost?: string;
      smtpPort?: number;
      smtpUsername?: string;
      smtpPassword?: string;
      smtpFromEmail?: string;
      customDomain?: string;
      whiteLabelEnabled?: boolean;
    }) => apiClient.post("/tenants", data, { headers: { "X-Silent-Error": "1" } }),
    updateTenant: (id: string, data: {
      name?: string;
      subdomain?: string;
      isActive?: boolean;
      status?: "active" | "inactive" | "suspended" | "trial";
      subscriptionPlan?: string;
      selectedModules?: string[];
      adminEmail?: string;
      adminName?: string;
      address?: string;
      state?: string;
      district?: string;
      pincode?: string;
      contactNumber?: string;
      gstNumber?: string;
      panNumber?: string;
      logoUrl?: string;
      timezone?: string;
      currency?: string;
      language?: string;
      billingStartDate?: string;
      billingEndDate?: string;
      trialExpiryDate?: string;
      employeeLimit?: number;
      storageLimitGb?: number;
      smsCredits?: number;
      whatsAppIntegrationEnabled?: boolean;
      smtpHost?: string;
      smtpPort?: number;
      smtpUsername?: string;
      smtpPassword?: string;
      smtpFromEmail?: string;
      customDomain?: string;
      whiteLabelEnabled?: boolean;
    }) => apiClient.put(`/tenants/${id}`, data, { headers: { "X-Silent-Error": "1" } }),
    tenantHealth: (id: string) =>
      apiClient.get(`/tenants/${id}/health`, { headers: { "X-Silent-Error": "1" } }),
    repairTenant: (id: string) =>
      apiClient.post(`/tenants/${id}/repair`, {}, { headers: { "X-Silent-Error": "1" } }),
    tenantProvisioningLogs: (id: string, take = 100) =>
      apiClient.get(`/tenants/${id}/provisioning/logs?take=${take}`, { headers: { "X-Silent-Error": "1" } }),
    deleteTenant: (id: string) => apiClient.delete(`/tenants/${id}`, { headers: { "X-Silent-Error": "1" } }),
    users: (includeDeleted?: boolean) => apiClient.get(`/users${includeDeleted ? "?includeDeleted=true" : ""}`),
    createUser: (data: { email: string; password: string; fullName?: string; isActive?: boolean; roles?: string[]; tenantId?: string }) =>
      apiClient.post("/users", data),
    updateUser: (id: string, data: { fullName?: string; password?: string; isActive?: boolean; roles?: string[] }) =>
      apiClient.put(`/users/${id}`, data),
    deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
    roles: () => apiClient.get("/roles"),
    createRole: (data: { name: string; description?: string }) => apiClient.post("/roles", data),
    updateRole: (id: string, data: { name?: string; description?: string }) => apiClient.put(`/roles/${id}`, data),
    deleteRole: (id: string) => apiClient.delete(`/roles/${id}`),
    rolePermissions: (roleId: string) => apiClient.get(`/roles/${roleId}/permissions`),
    updateRolePermissions: (roleId: string, permissionIds: string[]) =>
      apiClient.put(`/roles/${roleId}/permissions`, { permissionIds }),
    permissions: () => apiClient.get("/permissions"),
    createPermission: (data: { module: string; action: string; name?: string; description?: string }) =>
      apiClient.post("/permissions", data),
    deletePermission: (id: string) => apiClient.delete(`/permissions/${id}`),
    featureFlags: () => apiClient.get("/settings/feature-flags"),
    tenantConfig: {
      get: () => apiClient.get("/settings/tenant-config"),
      update: (data: ApiPayload) => apiClient.put("/settings/tenant-config", data),
    },
    auditLogs: (params?: { page?: number; limit?: number; entity?: string; action?: string; performedBy?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.entity) query.append("entity", params.entity);
      if (params?.action) query.append("action", params.action);
      if (params?.performedBy) query.append("performedBy", params.performedBy);
      const suffix = query.toString() ? `?${query}` : "";
      return apiClient.get(`/auditlogs${suffix}`);
    },
    recycleBin: {
      listDeleted: (params?: { page?: number; limit?: number; entity?: string; tenantId?: string }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append("page", params.page.toString());
        if (params?.limit) query.append("limit", params.limit.toString());
        if (params?.entity) query.append("entity", params.entity);
        if (params?.tenantId) query.append("tenantId", params.tenantId);
        const suffix = query.toString() ? `?${query}` : "";
        return apiClient.get(`/auditlogs/deleted${suffix}`);
      },
      restore: (entityName: string, entityId: string) =>
        apiClient.post("/auditlogs/restore", { entityName, entityId }),
      hardDelete: (entityName: string, entityId: string) =>
        apiClient.delete("/auditlogs/hard-delete", { data: { entityName, entityId } }),
    },
    contactSubmissions: {
      list: (page = 1, limit = 20) =>
        apiClient.get(`/contactsubmissions?page=${page}&limit=${limit}`),
      update: (id: string, data: { isResolved: boolean }) =>
        apiClient.put(`/contactsubmissions/${id}`, data),
    },
    systemHealth: () => fetch("/health", { credentials: "include", headers: { "X-Silent-Error": "1" } }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      return { data: await response.json() };
    }),
  },
  website: {
    listPages: () => apiClient.get<WebsitePagesResponse>("/website/pages"),
    updatePage: (pageType: string, payload: { title: string; contentJson: string; tenantId?: string }) =>
      apiClient.put<WebsitePageSummary>(`/website/pages/${pageType}`, payload),
    publishPage: (pageType: string, tenantId?: string) =>
      apiClient.post(`/website/pages/${pageType}/publish${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ""}`, {}),
    unpublishPage: (pageType: string, tenantId?: string) =>
      apiClient.post(`/website/pages/${pageType}/unpublish${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ""}`, {}),
  },
  superadmin: {
    tenants: (page = 1, limit = 20, search?: string, status?: string) =>
      apiClient.get(`/superadmin/tenants?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${status}` : ""}`),
    createTenant: (data: ApiPayload) => apiClient.post("/superadmin/tenants", data),
    updateStatus: (id: string, isActive: boolean, status?: string) =>
      apiClient.patch(`/superadmin/tenants/${id}/status`, { isActive, status }),
  },
  adminSettings: {
    get: () => apiClient.get("/admin/settings"),
    update: (data: ApiPayload) => apiClient.put("/admin/settings", data),
    inviteUser: (data: { email: string; fullName?: string; role?: string; department?: string }) =>
      apiClient.post("/admin/users/invite", data),
  },
};
