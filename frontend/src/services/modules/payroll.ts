import apiClient from "@/services/apiClient";
import type { PayrollOverviewStats, PayrollRunSummary } from "@/types";
import type { ApiPayload } from "./shared";

export const payrollApi = {
  dashboard: () => apiClient.get<PayrollOverviewStats>("/reports/payroll/overview"),
  structures: {
    list: (params?: { page?: number; limit?: number; companyId?: string; projectId?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.companyId) query.append("companyId", params.companyId);
      if (params?.projectId) query.append("projectId", params.projectId);
      const suffix = query.toString() ? `?${query}` : "";
      return apiClient.get(`/payroll/structures${suffix}`);
    },
    getById: (id: string) => apiClient.get(`/payroll/structures/${id}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/structures", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/payroll/structures/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payroll/structures/${id}`),
  },
  policies: {
    getSchema: (companyId?: string, projectId?: string) => {
      const query = new URLSearchParams();
      if (companyId) query.append("companyId", companyId);
      if (projectId) query.append("projectId", projectId);
      const suffix = query.toString() ? `?${query}` : "";
      return apiClient.get(`/payroll/policies/schema${suffix}`);
    },
    list: (companyId?: string, projectId?: string) => {
      const query = new URLSearchParams();
      if (companyId) query.append("companyId", companyId);
      if (projectId) query.append("projectId", projectId);
      const suffix = query.toString() ? `?${query}` : "";
      return apiClient.get(`/payroll/policies${suffix}`);
    },
    getById: (id: string) => apiClient.get(`/payroll/policies/${id}`),
    getDefault: () => apiClient.get("/payroll/policies/default"),
    create: (data: ApiPayload) => apiClient.post("/payroll/policies", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/payroll/policies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payroll/policies/${id}`),
    setDefault: (id: string) => apiClient.post(`/payroll/policies/${id}/set-default`, {}),
  },
  components: {
    list: (structureId?: string) => {
      const suffix = structureId ? `?structureId=${encodeURIComponent(structureId)}` : "";
      return apiClient.get(`/payroll/components${suffix}`);
    },
    getById: (id: string) => apiClient.get(`/payroll/components/${id}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/components", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/payroll/components/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payroll/components/${id}`),
  },
  runs: {
    list: (status?: string) =>
      apiClient.get<PayrollRunSummary[]>(
        `/payroll/runs${status ? `?status=${encodeURIComponent(status)}` : ""}`
      ),
    getById: (id: string) => apiClient.get(`/payroll/runs/${id}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/runs", data),
    complete: (id: string) => apiClient.post(`/payroll/runs/${id}/complete`, {}),
    bankFile: (id: string) => apiClient.get(`/payroll/runs/${id}/bank-file`, { responseType: "blob" }),
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
    download: (id: string) => apiClient.get(`/payroll/payslips/${id}/download`, { responseType: "blob" }),
    mine: () => apiClient.get("/payroll/payslips/me"),
  },
  employees: () => apiClient.get("/payroll/employees"),
  taxDeclarations: {
    list: (financialYear?: number) =>
      apiClient.get(`/payroll/tax-declarations${financialYear ? `?financialYear=${financialYear}` : ""}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/tax-declarations", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/payroll/tax-declarations/${id}`, data),
    verify: (id: string) => apiClient.post(`/payroll/tax-declarations/${id}/verify`, {}),
  },
  reimbursements: {
    list: (status?: string) =>
      apiClient.get(`/payroll/reimbursements${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/reimbursements", data),
    approve: (id: string) => apiClient.post(`/payroll/reimbursements/${id}/approve`, {}),
    reject: (id: string) => apiClient.post(`/payroll/reimbursements/${id}/reject`, {}),
    markPaid: (id: string) => apiClient.post(`/payroll/reimbursements/${id}/mark-paid`, {}),
  },
  settlements: {
    list: () => apiClient.get("/payroll/settlements"),
    create: (data: ApiPayload) => apiClient.post("/payroll/settlements", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/payroll/settlements/${id}`, data),
    settle: (id: string) => apiClient.post(`/payroll/settlements/${id}/settle`, {}),
    compute: (data: ApiPayload) => apiClient.post("/payroll/settlements/compute", data),
    delete: (id: string) => apiClient.delete(`/payroll/settlements/${id}`),
  },
  loans: {
    list: (status?: string) =>
      apiClient.get(`/payroll/loans${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/loans", data),
    approve: (id: string) => apiClient.post(`/payroll/loans/${id}/approve`, {}),
    activate: (id: string) => apiClient.post(`/payroll/loans/${id}/activate`, {}),
    recordEmi: (id: string) => apiClient.post(`/payroll/loans/${id}/emi`, {}),
    close: (id: string) => apiClient.post(`/payroll/loans/${id}/close`, {}),
  },
  bonuses: {
    list: (status?: string) =>
      apiClient.get(`/payroll/bonuses${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/bonuses", data),
    approve: (id: string) => apiClient.post(`/payroll/bonuses/${id}/approve`, {}),
    pay: (id: string) => apiClient.post(`/payroll/bonuses/${id}/pay`, {}),
    reject: (id: string) => apiClient.post(`/payroll/bonuses/${id}/reject`, {}),
  },
  arrears: {
    list: (status?: string) =>
      apiClient.get(`/payroll/arrears${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    create: (data: ApiPayload) => apiClient.post("/payroll/arrears", data),
    approve: (id: string) => apiClient.post(`/payroll/arrears/${id}/approve`, {}),
    process: (id: string) => apiClient.post(`/payroll/arrears/${id}/process`, {}),
  },
  statutory: {
    pf: (month?: string) =>
      apiClient.get(`/payroll/statutory/pf${month ? `?month=${encodeURIComponent(month)}` : ""}`),
    esi: (month?: string) =>
      apiClient.get(`/payroll/statutory/esi${month ? `?month=${encodeURIComponent(month)}` : ""}`),
    pt: (month?: string) =>
      apiClient.get(`/payroll/statutory/pt${month ? `?month=${encodeURIComponent(month)}` : ""}`),
    tds: (month?: string) =>
      apiClient.get(`/payroll/statutory/tds${month ? `?month=${encodeURIComponent(month)}` : ""}`),
    pfEcr: (month?: string) =>
      apiClient.get(`/payroll/statutory/pf/ecr${month ? `?month=${encodeURIComponent(month)}` : ""}`, { responseType: "blob" }),
    esiChallan: (month?: string) =>
      apiClient.get(`/payroll/statutory/esi/challan${month ? `?month=${encodeURIComponent(month)}` : ""}`, { responseType: "blob" }),
    form24q: (financialYear?: number) =>
      apiClient.get(`/payroll/statutory/tds/form24q${financialYear ? `?financialYear=${financialYear}` : ""}`, { responseType: "blob" }),
    form16: (employeeId: string, financialYear?: number) =>
      apiClient.get(`/payroll/statutory/form16/${employeeId}${financialYear ? `?financialYear=${financialYear}` : ""}`, { responseType: "blob" }),
  },
};
