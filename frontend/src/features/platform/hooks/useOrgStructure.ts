import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgApi } from "@/services/modules/org";
import type { OrgStructureRecord } from "@/types";

export type OrgResource =
  | "departments"
  | "designations"
  | "branches"
  | "costCenters"
  | "businessUnits";

const responseKey: Record<OrgResource, keyof typeof orgApi.orgStructure> = {
  departments: "departments",
  designations: "designations",
  branches: "branches",
  costCenters: "costCenters",
  businessUnits: "businessUnits",
};

const listKey: Record<OrgResource, string> = {
  departments: "departments",
  designations: "designations",
  branches: "branches",
  costCenters: "costCenters",
  businessUnits: "businessUnits",
};

export const orgStructureQueryKey = (resource: OrgResource, companyId?: string | null) =>
  ["org", resource, companyId ?? "all"] as const;

export const useOrgStructureList = (resource: OrgResource, companyId?: string | null) =>
  useQuery({
    queryKey: orgStructureQueryKey(resource, companyId),
    queryFn: async () => {
      const client = orgApi.orgStructure[responseKey[resource]];
      const { data } = await client.list(companyId ?? undefined);
      const key = listKey[resource];
      const payload = data as Record<string, OrgStructureRecord[] | number>;
      return (payload[key] as OrgStructureRecord[]) ?? [];
    },
    staleTime: 30_000,
  });

export const useOrgStructureMutations = (resource: OrgResource) => {
  const queryClient = useQueryClient();
  const client = orgApi.orgStructure[responseKey[resource]];

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["org", resource] });
  };

  const create = useMutation({
    mutationFn: (payload: Parameters<typeof client.create>[0]) => client.create(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof client.update>[1] }) =>
      client.update(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => client.delete(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
};

export const mapOrgStructureRecord = (record: OrgStructureRecord) => ({
  id: record.id,
  companyId: record.companyId,
  code: record.code,
  name: record.name,
  description: record.description,
  isActive: record.isActive,
  city: record.city,
  state: record.state,
  gstin: record.gstin,
  isWarehouse: record.isWarehouse ?? false,
  grade: record.grade,
  level: record.level,
  costCenterType: record.costCenterType,
  status: record.isActive ? ("Active" as const) : ("Inactive" as const),
});
