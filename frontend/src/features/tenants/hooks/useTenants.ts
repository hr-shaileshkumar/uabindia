import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "../services/tenant.api";
import type { TenantFormValues, TenantBulkAction } from "../validations/tenant.schema";

export const tenantKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantKeys.all, "list"] as const,
  list: (filters: string) => [...tenantKeys.lists(), { filters }] as const,
  details: () => [...tenantKeys.all, "detail"] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
};

export const useTenants = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: tenantKeys.list(JSON.stringify(params)),
    queryFn: () => tenantApi.getTenants(params),
  });
};

export const useTenant = (id: string) => {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => tenantApi.getTenantById(id),
    enabled: !!id,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTenant: TenantFormValues) => tenantApi.createTenant(newTenant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TenantFormValues> }) => tenantApi.updateTenant(id, data),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.details() });
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
};

export const useRestoreTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.restoreTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
};

export const useBulkTenantAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantBulkAction) => tenantApi.bulkAction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
};
