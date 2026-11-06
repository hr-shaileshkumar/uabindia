import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  companiesQueryKey,
  companiesRootQueryKey,
  createCompany,
  deleteCompany,
  listCompanies,
  listTenants,
  tenantsQueryKey,
  updateCompany,
} from "./api";
import type { CompanyMutationPayload } from "./types";

export const useCompanies = (page = 1, limit = 10, tenant?: string, includeDeleted = false) =>
  useQuery({
    queryKey: companiesQueryKey(page, limit, tenant, includeDeleted),
    queryFn: () => listCompanies(page, limit, tenant, includeDeleted),
  });

export const useTenants = (enabled: boolean) =>
  useQuery({
    queryKey: tenantsQueryKey,
    queryFn: listTenants,
    enabled,
    staleTime: 5 * 60_000,
  });

export const useCompanyMutations = () => {
  const queryClient = useQueryClient();

  const invalidateCompanies = async () => {
    await queryClient.invalidateQueries({ queryKey: companiesRootQueryKey });
  };

  const createCompanyMutation = useMutation({
    mutationFn: ({ payload, tenant }: { payload: CompanyMutationPayload; tenant?: string }) =>
      createCompany(payload, tenant ? { tenant } : undefined),
    onSuccess: invalidateCompanies,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompanyMutationPayload }) =>
      updateCompany(id, payload),
    onSuccess: invalidateCompanies,
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: invalidateCompanies,
  });

  return {
    createCompanyMutation,
    updateCompanyMutation,
    deleteCompanyMutation,
  };
};
