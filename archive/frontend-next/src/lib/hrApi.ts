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

/**
 * Unified ERP API Client - 4-Layer Architecture
 * 
 * LAYER 1: Platform / Core (System-level, admin-only)
 * LAYER 2: Modules & Licensing (Product control)
 * LAYER 3: Authentication & Security (Identity layer)
 * LAYER 4: Business Modules (Client-facing: HRMS, Payroll, Reports)
 */
const hrApi = {
  // LAYER 1: Platform / Core (Admin-only)
  modules: {
    getEnabled: () => apiClient.get<ModulesResponse>("/modules/enabled"),
    catalog: () => apiClient.get("/modules/catalog"),
    subscriptions: () => apiClient.get("/modules/subscriptions"),
    updateSubscriptions: (data: { subscriptions: { moduleKey: string; isEnabled: boolean }[] }) =>
      apiClient.post("/modules/subscriptions", data),
  },
  licensing: {
    apiKeys: () => apiClient.get("/licensing/api-keys"),
  },
  platform: {
    tenants: () => apiClient.get("/tenants"),
    createTenant: (data: { name: string; subdomain: string; adminEmail: string; adminPassword: string }) =>
      apiClient.post("/tenants", data),
    updateTenant: (id: string, data: { name?: string; subdomain?: string; isActive?: boolean }) =>
      apiClient.put(`/tenants/${id}`, data),
    deleteTenant: (id: string) => apiClient.delete(`/tenants/${id}`),
    users: () => apiClient.get("/users"),
    roles: () => apiClient.get("/roles"),
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
    contactSubmissions: {
      list: (page = 1, limit = 20) =>
        apiClient.get(`/contactsubmissions?page=${page}&limit=${limit}`),
      update: (id: string, data: { isResolved: boolean }) =>
        apiClient.put(`/contactsubmissions/${id}`, data),
    },
  },
  company: {
    getAll: (page = 1, limit = 10) =>
      apiClient.get<CompaniesResponse>(`/companies?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/companies/${id}`),
    create: (data: ApiPayload, options?: { tenant?: string }) =>
      apiClient.post("/companies", data, options?.tenant ? { headers: { "X-Tenant": options.tenant } } : undefined),
    update: (id: string, data: ApiPayload) => apiClient.put(`/companies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/companies/${id}`),
  },
  project: {
    getAll: (companyId?: string) =>
      apiClient.get<ProjectsResponse>(`/projects${companyId ? `?companyId=${companyId}` : ""}`),
    getByCompany: (companyId: string) =>
      apiClient.get<ProjectsResponse>(`/projects?companyId=${companyId}`),
    getById: (id: string) => apiClient.get(`/projects/${id}`),
  },

  // LAYER 3: Security (Identity & Access)
  security: {
    deviceSessions: () => apiClient.get("/security/device-sessions"),
    passwordPolicy: () => apiClient.get("/security/password-policy"),
    refreshTokens: () => apiClient.get("/security/device-sessions"), // Same endpoint
  },

  // Workflow & Approvals
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

  // System Information
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

  // Search (Global navigation search)
  search: {
    query: (q: string) =>
      apiClient.get<{ results: SearchResult[] }>(`/search?q=${q}`),
  },

  // LAYER 4: Business Modules

  // Dashboard
  dashboard: {
    getStats: () =>
      apiClient.get<DashboardStats>("/hr/dashboard"),
  },

  // HRMS Module (Employee management, attendance, leave)
  hrms: {
    employees: {
      list: (page = 1, limit = 10) =>
        apiClient.get(`/employees?page=${page}&limit=${limit}`),
      getById: (id: string) =>
        apiClient.get(`/employees/${id}`),
      create: (data: ApiPayload) =>
        apiClient.post("/employees", data),
      update: (id: string, data: ApiPayload) =>
        apiClient.put(`/employees/${id}`, data),
    },
    attendance: {
      list: (page = 1, limit = 10) =>
        apiClient.get(`/attendance?page=${page}&limit=${limit}`),
      getById: (id: string) =>
        apiClient.get(`/attendance/${id}`),
      markAttendance: (data: ApiPayload) =>
        apiClient.post("/attendance/punch", data),
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
      list: (page = 1, limit = 10) =>
        apiClient.get(`/leave/requests?page=${page}&limit=${limit}`),
      getById: (id: string) =>
        apiClient.get(`/leave/requests/${id}`),
      requestLeave: (data: ApiPayload) =>
        apiClient.post("/leave/requests", data),
      approveLeave: (id: string) =>
        apiClient.post(`/leave/requests/${id}/approve`, {}),
      rejectLeave: (id: string) =>
        apiClient.post(`/leave/requests/${id}/reject`, {}),
      approvals: {
        list: (status = "Pending") => apiClient.get(`/leave/approvals?status=${status}`),
      },
      balances: {
        list: (employeeId?: string) =>
          apiClient.get(`/leave/balances${employeeId ? `?employeeId=${employeeId}` : ""}`),
      },
      holidays: {
        list: (year?: number) =>
          apiClient.get(`/leave/holidays${year ? `?year=${year}` : ""}`),
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

  // Payroll Module (Salary processing, components, payslips)
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
      getById: (id: string) =>
        apiClient.get(`/payroll/payslips/${id}`),
      download: (id: string) =>
        apiClient.get(`/payroll/payslips/${id}/download`, { responseType: 'blob' }),
    },
    statutory: {
      pf: () => apiClient.get("/payroll/statutory/pf"),
      esi: () => apiClient.get("/payroll/statutory/esi"),
      pt: () => apiClient.get("/payroll/statutory/pt"),
      tds: () => apiClient.get("/payroll/statutory/tds"),
    },
  },

  // Compliance Module (reports & audits)
  compliance: {
    reports: {
      list: (pageNumber = 1, pageSize = 10) =>
        apiClient.get(`/compliance/reports?pageNumber=${pageNumber}&pageSize=${pageSize}`),
      listByType: (reportType: string, pageNumber = 1, pageSize = 10) =>
        apiClient.get(`/compliance/reports/${encodeURIComponent(reportType)}?pageNumber=${pageNumber}&pageSize=${pageSize}`),
      create: (data: ApiPayload) => apiClient.post("/compliance/reports", data),
    },
    audits: {
      list: (pageNumber = 1, pageSize = 10) =>
        apiClient.get(`/compliance/audits?pageNumber=${pageNumber}&pageSize=${pageSize}`),
      create: (data: ApiPayload) => apiClient.post("/compliance/audits", data),
    },
  },

  // Reports Module (Analytics across all modules)
  reports: {
    hr: {
      headcount: () => apiClient.get("/reports/hr/headcount"),
      attendance: () => apiClient.get("/reports/hr/attendance-summary"),
      leave: (year?: number) => apiClient.get(`/reports/hr/leave-summary${year ? `?year=${year}` : ""}`),
      turnover: () => apiClient.get("/reports/hr/turnover"),
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

  // ERP Modules
  erp: {
    // Sales & CRM
    customers: {
      getAll: (page = 1, limit = 10) =>
        apiClient.get(`/customers?page=${page}&limit=${limit}`),
      getById: (id: string) =>
        apiClient.get(`/customers/${id}`),
      create: (data: ApiPayload) =>
        apiClient.post("/customers", data),
      update: (id: string, data: ApiPayload) =>
        apiClient.put(`/customers/${id}`, data),
      delete: (id: string) =>
        apiClient.delete(`/customers/${id}`),
    },

    salesOrders: {
      getAll: (page = 1, limit = 10) =>
        apiClient.get(`/salesorders?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/salesorders/${id}`),
      create: (data: ApiPayload) => apiClient.post("/salesorders", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/salesorders/${id}`, data),
      delete: (id: string) => apiClient.delete(`/salesorders/${id}`),
    },

    // Purchase & Procurement
    vendors: {
      getAll: (page = 1, limit = 10) =>
        apiClient.get(`/vendors?page=${page}&limit=${limit}`),
      getById: (id: string) =>
        apiClient.get(`/vendors/${id}`),
      create: (data: ApiPayload) =>
        apiClient.post("/vendors", data),
      update: (id: string, data: ApiPayload) =>
        apiClient.put(`/vendors/${id}`, data),
      delete: (id: string) =>
        apiClient.delete(`/vendors/${id}`),
    },

    purchaseOrders: {
      getAll: (page = 1, limit = 10) =>
        apiClient.get(`/purchaseorders?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/purchaseorders/${id}`),
      create: (data: ApiPayload) => apiClient.post("/purchaseorders", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/purchaseorders/${id}`, data),
      delete: (id: string) => apiClient.delete(`/purchaseorders/${id}`),
    },

    // Inventory
    items: {
      getAll: (page = 1, limit = 10) =>
        apiClient.get(`/items?page=${page}&limit=${limit}`),
      getById: (id: string) =>
        apiClient.get(`/items/${id}`),
      create: (data: ApiPayload) =>
        apiClient.post("/items", data),
      update: (id: string, data: ApiPayload) =>
        apiClient.put(`/items/${id}`, data),
      delete: (id: string) =>
        apiClient.delete(`/items/${id}`),
    },

    // Finance & Accounting
    chartOfAccounts: {
      getAll: () =>
        apiClient.get("/chartOfAccounts"),
      getById: (id: string) =>
        apiClient.get(`/chartOfAccounts/${id}`),
      create: (data: ApiPayload) =>
        apiClient.post("/chartOfAccounts", data),
      getBalances: () =>
        apiClient.get("/chartOfAccounts/getBalances"),
    },
  },
};

export { hrApi };
export default hrApi;

