import apiClient from "@/services/apiClient";
import type { Tenant, PaginatedTenants } from "../types";
import type { TenantFormValues, TenantBulkAction } from "../validations/tenant.schema";

export const tenantApi = {
  getTenants: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedTenants> => {
    const { data } = await apiClient.get<PaginatedTenants>("/tenants", { params });
    return data;
  },

  getTenantById: async (id: string): Promise<Tenant> => {
    const { data } = await apiClient.get<Tenant>(`/tenants/${id}`);
    return data;
  },

  createTenant: async (tenant: TenantFormValues): Promise<Tenant> => {
    const { data } = await apiClient.post<Tenant>("/tenants", tenant);
    return data;
  },

  updateTenant: async (id: string, tenant: Partial<TenantFormValues>): Promise<Tenant> => {
    const { data } = await apiClient.put<Tenant>(`/tenants/${id}`, tenant);
    return data;
  },

  deleteTenant: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenants/${id}`);
  },

  restoreTenant: async (id: string): Promise<Tenant> => {
    const { data } = await apiClient.post<Tenant>(`/tenants/${id}/restore`);
    return data;
  },

  bulkAction: async (payload: TenantBulkAction): Promise<void> => {
    await apiClient.post("/tenants/bulk", payload);
  }
};
