import apiClient from "./apiClient";
import {
  ModulesResponse,
  CompaniesResponse,
  ProjectsResponse,
  AppVersion,
  DashboardStats,
  SearchResult,
} from "@/types";

type ApiPayload = Record<string, unknown>;
type OptionalApiPayload = Record<string, unknown> | undefined;

const hrApi = {
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
  platform: {
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
      smtpFromEmail?: string;
      customDomain?: string;
      whiteLabelEnabled?: boolean;
    }) =>
      apiClient.post("/tenants", data, { headers: { "X-Silent-Error": "1" } }),
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
      smtpFromEmail?: string;
      customDomain?: string;
      whiteLabelEnabled?: boolean;
    }) =>
      apiClient.put(`/tenants/${id}`, data, { headers: { "X-Silent-Error": "1" } }),
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
    projects: (companyId?: string) =>
      apiClient.get(`/projects${companyId ? `?companyId=${companyId}` : ""}`),
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
  },
  company: {
    getAll: (page = 1, limit = 10, includeDeleted?: boolean) =>
      apiClient.get<CompaniesResponse>(`/companies?page=${page}&limit=${limit}${includeDeleted ? "&includeDeleted=true" : ""}`),
    getAllForSuperAdmin: () => apiClient.get<{
      companies: Array<{
        id: string;
        name: string;
        tenantId: string;
        tenantName: string;
        financialYearStart?: string | null;
        financialYearEnd?: string | null;
      }>;
    }>("/companies/all"),
    getById: (id: string) => apiClient.get(`/companies/${id}`),
    create: (data: ApiPayload, options?: { tenant?: string }) =>
      apiClient.post("/companies", data, options?.tenant ? { headers: { "X-Tenant": options.tenant } } : undefined),
    update: (id: string, data: ApiPayload) => apiClient.put(`/companies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/companies/${id}`),
  },
  project: {
    getAll: (companyId?: string, status?: string, includeDeleted?: boolean) => {
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (status) params.append("status", status);
      if (includeDeleted) params.append("includeDeleted", "true");
      const qs = params.toString();
      return apiClient.get<ProjectsResponse>(`/projects${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => apiClient.get(`/projects/${id}`),
        getByCompany: (companyId: string) =>
          apiClient.get<ProjectsResponse>(`/projects?companyId=${companyId}`),
    restore: (id: string) => apiClient.post(`/projects/${id}/restore`, {}),
    create: (data: {
      name: string;
      companyId: string;
      tenantId?: string;
      projectCode?: string;
      description?: string;
      projectType?: string;
      priority?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      budget?: number;
      currencyCode?: string;
      clientName?: string;
      contractNumber?: string;
      billingType?: string;
      projectManagerId?: string;
      location?: string;
    }) => apiClient.post("/projects", data),
    update: (id: string, data: {
      name?: string;
      companyId?: string;
      projectCode?: string;
      description?: string;
      projectType?: string;
      priority?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      actualStartDate?: string;
      actualEndDate?: string;
      budget?: number;
      actualCost?: number;
      currencyCode?: string;
      clientName?: string;
      contractNumber?: string;
      billingType?: string;
      completionPercentage?: number;
      projectManagerId?: string;
      location?: string;
    }) => apiClient.put(`/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/projects/${id}`),
  },
  security: {
    deviceSessions: () => apiClient.get("/security/device-sessions"),
    passwordPolicy: () => apiClient.get("/security/password-policy"),
    refreshTokens: () => apiClient.get("/security/device-sessions"),
  },
  workflows: {
    getByModule: (moduleKey: string) => apiClient.get(`/workflows/${moduleKey}`),
    upsert: (data: ApiPayload) => apiClient.put("/workflows", data),
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
    query: (q: string) =>
      apiClient.get<{ results: SearchResult[] }>(`/search?q=${q}`),
  },
  dashboard: {
    getStats: () =>
      apiClient.get<DashboardStats>("/hr/dashboard"),
  },
  hrms: {
    employees: {
      list: (page = 1, limit = 10, params?: { companyId?: string; projectId?: string; search?: string; status?: string }) => {
        const query = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (params?.companyId) query.append("companyId", params.companyId);
        if (params?.projectId) query.append("projectId", params.projectId);
        if (params?.search) query.append("search", params.search);
        if (params?.status) query.append("status", params.status);
        return apiClient.get(`/employees?${query}`);
      },
      getById: (id: string) => apiClient.get(`/employees/${id}`),
      create: (data: ApiPayload) => apiClient.post("/employees", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/employees/${id}`, data),
      delete: (id: string) => apiClient.delete(`/employees/${id}`),
    },
    attendance: {
      list: (page = 1, limit = 10) => apiClient.get(`/attendance?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/attendance/${id}`),
      markAttendance: (data: ApiPayload) => apiClient.post("/attendance/punch", data),
    },
    leave: {
      types: {
        list: () => apiClient.get("/leave/types"),
        create: (data: ApiPayload) => apiClient.post("/leave/types", data),
      },
      policies: {
        list: () => apiClient.get("/leave/policies"),
        create: (data: ApiPayload) => apiClient.post("/leave/policies", data),
        rules: {
          list: (policyId: string) => apiClient.get(`/leave/policies/${policyId}/rules`),
          create: (policyId: string, data: ApiPayload) => apiClient.post(`/leave/policies/${policyId}/rules`, data),
        },
      },
      list: (page = 1, limit = 10) => apiClient.get(`/leave/requests?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/leave/requests/${id}`),
      requestLeave: (data: ApiPayload) => apiClient.post("/leave/requests", data),
      approveLeave: (id: string) => apiClient.post(`/leave/requests/${id}/approve`, {}),
      rejectLeave: (id: string) => apiClient.post(`/leave/requests/${id}/reject`, {}),
      approvals: {
        list: (status = "Pending") => apiClient.get(`/leave/approvals?status=${status}`),
      },
      balances: {
        list: (employeeId?: string) => apiClient.get(`/leave/balances${employeeId ? `?employeeId=${employeeId}` : ""}`),
      },
      holidays: {
        list: (year?: number) => apiClient.get(`/leave/holidays${year ? `?year=${year}` : ""}`),
        create: (data: ApiPayload) => apiClient.post("/leave/holidays", data),
      },
      allocations: {
        list: (params?: { employeeId?: string; year?: number }) => {
          const query = new URLSearchParams();
          if (params?.employeeId) query.append("employeeId", params.employeeId);
          if (params?.year) query.append("year", params.year.toString());
          return apiClient.get(`/leave/allocations${query.toString() ? `?${query}` : ""}`);
        },
        create: (data: ApiPayload) => apiClient.post("/leave/allocations", data),
      },
    },
  },
  payroll: {
    dashboard: () => apiClient.get("/reports/payroll/overview"),
    structures: {
      list: (page?: number, limit?: number) => {
        const query = new URLSearchParams();
        if (page) query.append("page", page.toString());
        if (limit) query.append("limit", limit.toString());
        const suffix = query.toString() ? `?${query}` : "";
        return apiClient.get(`/payroll/structures${suffix}`);
      },
      getById: (id: string) => apiClient.get(`/payroll/structures/${id}`),
      create: (data: ApiPayload) => apiClient.post("/payroll/structures", data),
    },
    components: {
      list: (page?: number, limit?: number) => {
        const query = new URLSearchParams();
        if (page) query.append("page", page.toString());
        if (limit) query.append("limit", limit.toString());
        const suffix = query.toString() ? `?${query}` : "";
        return apiClient.get(`/payroll/components${suffix}`);
      },
      getById: (id: string) => apiClient.get(`/payroll/components/${id}`),
      create: (data: ApiPayload) => apiClient.post("/payroll/components", data),
    },
    runs: {
      list: (status?: string) => apiClient.get(`/payroll/runs${status ? `?status=${encodeURIComponent(status)}` : ""}`),
      getById: (id: string) => apiClient.get(`/payroll/runs/${id}`),
      create: (data: ApiPayload) => apiClient.post("/payroll/runs", data),
      complete: (id: string) => apiClient.post(`/payroll/runs/${id}/complete`, {}),
    },
    payslips: {
      list: (params?: { runId?: string; employeeId?: string }) => {
        const query = new URLSearchParams();
        if (params?.runId) query.append("runId", params.runId);
        if (params?.employeeId) query.append("employeeId", params.employeeId);
        const suffix = query.toString() ? `?${query}` : "";
        return apiClient.get(`/payroll/payslips${suffix}`);
      },
      getById: (id: string) => apiClient.get(`/payroll/payslips/${id}`),
      download: (id: string) => apiClient.get(`/payroll/payslips/${id}/download`, { responseType: 'blob' }),
    },
    statutory: {
      pf: () => apiClient.get("/payroll/statutory/pf"),
      esi: () => apiClient.get("/payroll/statutory/esi"),
      pt: () => apiClient.get("/payroll/statutory/pt"),
      tds: () => apiClient.get("/payroll/statutory/tds"),
    },
  },
  compliance: {
    reports: {
      list: (pageNumber = 1, pageSize = 10) => apiClient.get(`/compliance/reports?pageNumber=${pageNumber}&pageSize=${pageSize}`),
      listByType: (reportType: string, pageNumber = 1, pageSize = 10) => apiClient.get(`/compliance/reports/${encodeURIComponent(reportType)}?pageNumber=${pageNumber}&pageSize=${pageSize}`),
      create: (data: ApiPayload) => apiClient.post("/compliance/reports", data),
    },
    audits: {
      list: (pageNumber = 1, pageSize = 10) => apiClient.get(`/compliance/audits?pageNumber=${pageNumber}&pageSize=${pageSize}`),
      create: (data: ApiPayload) => apiClient.post("/compliance/audits", data),
    },
  },
  reports: {
    hr: {
      headcount: () => apiClient.get("/reports/hr/headcount"),
      attendance: () => apiClient.get("/reports/hr/attendance-summary"),
      leave: (year?: number) => apiClient.get(`/reports/hr/leave-summary${year ? `?year=${year}` : ""}`),
      turnover: () => apiClient.get("/reports/hr/turnover"),
      projectCompare: (params?: { companyId?: string; projectIds?: string[]; fromDate?: string; toDate?: string }) => {
        const query = new URLSearchParams();
        if (params?.companyId) query.append("companyId", params.companyId);
        if (params?.projectIds?.length) {
          params.projectIds.forEach((id) => query.append("projectIds", id));
        }
        if (params?.fromDate) query.append("fromDate", params.fromDate);
        if (params?.toDate) query.append("toDate", params.toDate);
        const suffix = query.toString() ? `?${query}` : "";
        return apiClient.get(`/reports/hr/project-compare${suffix}`, { headers: { "X-Silent-Error": "1" } });
      },
    },
    payroll: {
      overview: () => apiClient.get("/reports/payroll/overview"),
      monthly: (year?: number) => apiClient.get(`/reports/payroll/monthly${year ? `?year=${year}` : ""}`),
      components: () => apiClient.get("/reports/payroll/components"),
      structures: () => apiClient.get("/reports/payroll/structures"),
    },
    compliance: {
      auditLog: (fromDate?: string, toDate?: string) => {
        const query = new URLSearchParams();
        if (fromDate) query.append("fromDate", fromDate);
        if (toDate) query.append("toDate", toDate);
        const suffix = query.toString() ? `?${query}` : "";
        return apiClient.get(`/reports/compliance/audit-log${suffix}`);
      },
      dataQuality: () => apiClient.get("/reports/compliance/data-quality"),
      moduleUsage: () => apiClient.get("/reports/compliance/module-usage"),
    },
  },
  erp: {
    customers: {
      getAll: (page = 1, limit = 10) => apiClient.get(`/customers?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/customers/${id}`),
      create: (data: ApiPayload) => apiClient.post("/customers", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/customers/${id}`, data),
      delete: (id: string) => apiClient.delete(`/customers/${id}`),
    },
    salesOrders: {
      getAll: (page = 1, limit = 10) => apiClient.get(`/salesorders?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/salesorders/${id}`),
      create: (data: ApiPayload) => apiClient.post("/salesorders", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/salesorders/${id}`, data),
      delete: (id: string) => apiClient.delete(`/salesorders/${id}`),
    },
    vendors: {
      getAll: (page = 1, limit = 10) => apiClient.get(`/vendors?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/vendors/${id}`),
      create: (data: ApiPayload) => apiClient.post("/vendors", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/vendors/${id}`, data),
      delete: (id: string) => apiClient.delete(`/vendors/${id}`),
    },
    purchaseOrders: {
      getAll: (page = 1, limit = 10) => apiClient.get(`/purchaseorders?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/purchaseorders/${id}`),
      create: (data: ApiPayload) => apiClient.post("/purchaseorders", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/purchaseorders/${id}`, data),
      delete: (id: string) => apiClient.delete(`/purchaseorders/${id}`),
    },
    items: {
      getAll: (page = 1, limit = 10) => apiClient.get(`/items?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/items/${id}`),
      create: (data: ApiPayload) => apiClient.post("/items", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/items/${id}`, data),
      delete: (id: string) => apiClient.delete(`/items/${id}`),
    },
    chartOfAccounts: {
      getAll: () => apiClient.get("/chartOfAccounts"),
      getById: (id: string) => apiClient.get(`/chartOfAccounts/${id}`),
      create: (data: ApiPayload) => apiClient.post("/chartOfAccounts", data),
      getBalances: () => apiClient.get("/chartOfAccounts/getBalances"),
    },
    journalEntries: {
      list: (page = 1, limit = 20, status?: string) => {
        const q = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) q.append("status", status);
        return apiClient.get(`/journalentries?${q}`);
      },
      getById: (id: string) => apiClient.get(`/journalentries/${id}`),
      create: (data: ApiPayload) => apiClient.post("/journalentries", data),
      post: (id: string) => apiClient.post(`/journalentries/${id}/post`, {}),
      deleteDraft: (id: string) => apiClient.delete(`/journalentries/${id}`),
    },
    payments: {
      list: (page = 1, limit = 20, paymentType?: string) => {
        const q = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (paymentType) q.append("paymentType", paymentType);
        return apiClient.get(`/payments?${q}`);
      },
      getById: (id: string) => apiClient.get(`/payments/${id}`),
      create: (data: ApiPayload) => apiClient.post("/payments", data),
      delete: (id: string) => apiClient.delete(`/payments/${id}`),
    },
    warehouses: {
      list: (page = 1, limit = 50) => apiClient.get(`/warehouses?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/warehouses/${id}`),
      create: (data: ApiPayload) => apiClient.post("/warehouses", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/warehouses/${id}`, data),
      delete: (id: string) => apiClient.delete(`/warehouses/${id}`),
    },
    stockMovements: {
      list: (page = 1, limit = 20) => apiClient.get(`/stockmovements?page=${page}&limit=${limit}`),
      create: (data: ApiPayload) => apiClient.post("/stockmovements", data),
    },
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
  screenings: {
    getSchedule: (params?: { status?: string; fromDate?: string; toDate?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status)   q.set("status", params.status);
      if (params?.fromDate) q.set("fromDate", params.fromDate);
      if (params?.toDate)   q.set("toDate", params.toDate);
      if (params?.search)   q.set("search", params.search);
      if (params?.page)     q.set("page", String(params.page));
      if (params?.limit)    q.set("limit", String(params.limit));
      return apiClient.get(`/screenings/schedule?${q}`);
    },
    getResults: (params?: { result?: string; fromDate?: string; toDate?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.result)   q.set("result", params.result);
      if (params?.fromDate) q.set("fromDate", params.fromDate);
      if (params?.toDate)   q.set("toDate", params.toDate);
      if (params?.search)   q.set("search", params.search);
      if (params?.page)     q.set("page", String(params.page));
      if (params?.limit)    q.set("limit", String(params.limit));
      return apiClient.get(`/screenings/results?${q}`);
    },
  },
  training: {
    getAssessments: (params?: { result?: string; assessmentType?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.result)         q.set("result", params.result);
      if (params?.assessmentType) q.set("assessmentType", params.assessmentType);
      if (params?.search)         q.set("search", params.search);
      if (params?.page)           q.set("page", String(params.page));
      if (params?.limit)          q.set("limit", String(params.limit));
      return apiClient.get(`/training/assessments?${q}`);
    },
    getCertificates: (params?: { expired?: boolean; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.expired !== undefined) q.set("expired", String(params.expired));
      if (params?.search)                q.set("search", params.search);
      if (params?.page)                  q.set("page", String(params.page));
      if (params?.limit)                 q.set("limit", String(params.limit));
      return apiClient.get(`/training/certificates?${q}`);
    },
  },
  helpdesk: {
    tickets: {
      list: (params?: { status?: string; priority?: string; assignedTo?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.status)     q.set("status", params.status);
        if (params?.priority)   q.set("priority", params.priority);
        if (params?.assignedTo) q.set("assignedTo", params.assignedTo);
        if (params?.page)       q.set("page", String(params.page));
        if (params?.limit)      q.set("limit", String(params.limit));
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
        if (params?.page)   q.set("page", String(params.page));
        if (params?.limit)  q.set("limit", String(params.limit));
        return apiClient.get(`/helpdesk/escalations?${q}`);
      },
      getById: (id: string) => apiClient.get(`/helpdesk/escalations/${id}`),
      create: (data: ApiPayload) => apiClient.post("/helpdesk/escalations", data),
    },
    faq: {
      list: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.category) q.set("category", params.category);
        if (params?.search)   q.set("search", params.search);
        if (params?.page)     q.set("page", String(params.page));
        if (params?.limit)    q.set("limit", String(params.limit));
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
        if (params?.status)   q.set("status", params.status);
        if (params?.audience) q.set("audience", params.audience);
        if (params?.page)     q.set("page", String(params.page));
        if (params?.limit)    q.set("limit", String(params.limit));
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
        if (params?.page)     q.set("page", String(params.page));
        if (params?.limit)    q.set("limit", String(params.limit));
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
        if (params?.page)     q.set("page", String(params.page));
        if (params?.limit)    q.set("limit", String(params.limit));
        return apiClient.get(`/communication/sms-templates?${q}`);
      },
      getById: (id: string) => apiClient.get(`/communication/sms-templates/${id}`),
      create: (data: ApiPayload) => apiClient.post("/communication/sms-templates", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/communication/sms-templates/${id}`, data),
      delete: (id: string) => apiClient.delete(`/communication/sms-templates/${id}`),
    },
  },
};

export { hrApi };
export default hrApi;
