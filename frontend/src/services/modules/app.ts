import apiClient from "@/services/apiClient";
import type { AppVersion, DashboardStats, ModulesResponse, SearchResult } from "@/types";
import type { ApiPayload, OptionalApiPayload } from "./shared";

export const appApi = {
  modules: {
    getEnabled: () => apiClient.get<ModulesResponse>("/modules/enabled"),
    catalog: () => apiClient.get("/modules/catalog"),
    subscriptions: () => apiClient.get("/modules/subscriptions"),
    updateSubscriptions: (data: { subscriptions: { moduleKey: string; isEnabled: boolean }[] }) =>
      apiClient.post("/modules/subscriptions", data),
  },
  licensing: {
    apiKeys: () => apiClient.get("/integrations/api-keys"),
  },
  security: {
    deviceSessions: () => apiClient.get("/security/device-sessions"),
    passwordPolicy: () => apiClient.get("/security/password-policy"),
    refreshTokens: () => apiClient.get("/security/device-sessions"),
  },
  workflows: {
    getByModule: (moduleKey: string) => apiClient.get(`/workflows/definitions/${encodeURIComponent(moduleKey)}`),
    upsert: (data: ApiPayload) => apiClient.post("/workflows/definitions", data),
  },
  approvals: {
    list: (status = "Pending") => apiClient.get(`/approvals?status=${status}`),
    create: (data: ApiPayload) => apiClient.post("/approvals", data),
    approve: (id: string, data?: OptionalApiPayload) => apiClient.post(`/approvals/${id}/approve`, data || {}),
    reject: (id: string, data?: OptionalApiPayload) => apiClient.post(`/approvals/${id}/reject`, data || {}),
  },
  uiShell: {
    getNavigation: () => apiClient.get("/ui-shell/navigation"),
    getRouteRules: () => apiClient.get("/ui-shell/route-rules"),
    getDashboard: () => apiClient.get("/ui-shell/dashboard"),
    getPageSchema: (pageKey: string) => apiClient.get(`/ui-shell/page-schema/${encodeURIComponent(pageKey)}`),
  },
  system: {
    getVersion: async () => ({
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      buildNumber: "001",
      releaseDate: new Date().toISOString(),
    } as AppVersion),
    getAppInfo: async () => ({
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      buildNumber: "001",
      releaseDate: new Date().toISOString(),
    } as AppVersion),
    financialYears: () => apiClient.get("/system/financial-years"),
  },
  notifications: {
    listMine: (
      params?: { unreadOnly?: boolean; take?: number },
      options?: { suppressGlobalError?: boolean }
    ) => {
      const query = new URLSearchParams();
      if (typeof params?.unreadOnly === "boolean") {
        query.append("unreadOnly", params.unreadOnly ? "true" : "false");
      }
      if (params?.take) {
        query.append("take", params.take.toString());
      }
      const suffix = query.toString() ? `?${query.toString()}` : "";
      return apiClient.get(`/notifications/me${suffix}`, options?.suppressGlobalError
        ? { headers: { "X-Silent-Error": "1" } }
        : undefined);
    },
    unreadCount: (options?: { suppressGlobalError?: boolean }) =>
      apiClient.get<{ unread: number }>(
        "/notifications/me/unread-count",
        options?.suppressGlobalError ? { headers: { "X-Silent-Error": "1" } } : undefined
      ),
    markRead: (id: string, options?: { suppressGlobalError?: boolean }) =>
      apiClient.post(
        `/notifications/${id}/read`,
        {},
        options?.suppressGlobalError ? { headers: { "X-Silent-Error": "1" } } : undefined
      ),
  },
  documents: {
    list: (params?: { companyId?: string; projectId?: string; employeeId?: string; module?: string; category?: string }) => {
      const query = new URLSearchParams();
      if (params?.companyId) query.append("companyId", params.companyId);
      if (params?.projectId) query.append("projectId", params.projectId);
      if (params?.employeeId) query.append("employeeId", params.employeeId);
      if (params?.module) query.append("module", params.module);
      if (params?.category) query.append("category", params.category);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      return apiClient.get(`/documents${suffix}`);
    },
    upload: (formData: FormData) =>
      apiClient.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    download: (id: string) => apiClient.get(`/documents/${id}/download`, { responseType: "blob" }),
    delete: (id: string) => apiClient.delete(`/documents/${id}`),
  },
  search: {
    query: (q: string) => apiClient.get<{ results: SearchResult[] }>(`/search?q=${q}`),
  },
  dashboard: {
    getStats: () => apiClient.get<DashboardStats>("/hr/dashboard"),
  },
  entityFields: {
    getDefinitions: (entityName: string) => apiClient.get(`/entity-fields/definitions/${entityName}`),
    getAllDefinitions: () => apiClient.get("/entity-fields/definitions"),
    createDefinition: (data: ApiPayload) => apiClient.post("/entity-fields/definitions", data),
    updateDefinition: (id: string, data: ApiPayload) => apiClient.put(`/entity-fields/definitions/${id}`, data),
    deleteDefinition: (id: string) => apiClient.delete(`/entity-fields/definitions/${id}`),
    getValues: (entityName: string, recordId: string) => apiClient.get(`/entity-fields/values/${entityName}/${recordId}`),
    saveValues: (entityName: string, recordId: string, values: { fieldDefinitionId: string; value: string | null }[]) =>
      apiClient.post(`/entity-fields/values/${entityName}/${recordId}`, { values }),
  },
  helpdesk: {
    tickets: {
      list: (params?: { status?: string; priority?: string; assignedTo?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.priority) q.set("priority", params.priority);
        if (params?.assignedTo) q.set("assignedTo", params.assignedTo);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        return apiClient.get(`/helpdesk/tickets?${q}`);
      },
      getById: (id: string) => apiClient.get(`/helpdesk/tickets/${id}`),
      create: (data: ApiPayload) => apiClient.post("/helpdesk/tickets", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/helpdesk/tickets/${id}`, data),
      delete: (id: string) => apiClient.delete(`/helpdesk/tickets/${id}`),
    },
    escalations: {
      list: (params?: { status?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        return apiClient.get(`/helpdesk/escalations?${q}`);
      },
      getById: (id: string) => apiClient.get(`/helpdesk/escalations/${id}`),
      create: (data: ApiPayload) => apiClient.post("/helpdesk/escalations", data),
    },
    faq: {
      list: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.category) q.set("category", params.category);
        if (params?.search) q.set("search", params.search);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        return apiClient.get(`/helpdesk/faq?${q}`);
      },
      create: (data: ApiPayload) => apiClient.post("/helpdesk/faq", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/helpdesk/faq/${id}`, data),
      delete: (id: string) => apiClient.delete(`/helpdesk/faq/${id}`),
    },
  },
  communication: {
    announcements: {
      list: (params?: { status?: string; audience?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.audience) q.set("audience", params.audience);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        return apiClient.get(`/communication/announcements?${q}`);
      },
      getById: (id: string) => apiClient.get(`/communication/announcements/${id}`),
      create: (data: ApiPayload) => apiClient.post("/communication/announcements", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/communication/announcements/${id}`, data),
      delete: (id: string) => apiClient.delete(`/communication/announcements/${id}`),
    },
    emailTemplates: {
      list: (params?: { category?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.category) q.set("category", params.category);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        return apiClient.get(`/communication/email-templates?${q}`);
      },
      getById: (id: string) => apiClient.get(`/communication/email-templates/${id}`),
      create: (data: ApiPayload) => apiClient.post("/communication/email-templates", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/communication/email-templates/${id}`, data),
      delete: (id: string) => apiClient.delete(`/communication/email-templates/${id}`),
    },
    smsTemplates: {
      list: (params?: { category?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.category) q.set("category", params.category);
        if (params?.page) q.set("page", String(params.page));
        if (params?.limit) q.set("limit", String(params.limit));
        return apiClient.get(`/communication/sms-templates?${q}`);
      },
      getById: (id: string) => apiClient.get(`/communication/sms-templates/${id}`),
      create: (data: ApiPayload) => apiClient.post("/communication/sms-templates", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/communication/sms-templates/${id}`, data),
      delete: (id: string) => apiClient.delete(`/communication/sms-templates/${id}`),
    },
  },
};
