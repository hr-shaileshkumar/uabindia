import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const payrollApi = {
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
    download: (id: string) => apiClient.get(`/payroll/payslips/${id}/download`, { responseType: "blob" }),
  },
  statutory: {
    pf: () => apiClient.get("/payroll/statutory/pf"),
    esi: () => apiClient.get("/payroll/statutory/esi"),
    pt: () => apiClient.get("/payroll/statutory/pt"),
    tds: () => apiClient.get("/payroll/statutory/tds"),
  },
};
