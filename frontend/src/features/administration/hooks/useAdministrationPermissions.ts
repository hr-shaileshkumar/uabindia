import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "@/services/modules/administration";
import type { PermissionRecord, PermissionsResponse } from "@/types";

export const permissionsQueryKey = ["platform", "permissions"] as const;

export const useAdministrationPermissions = () =>
  useQuery({
    queryKey: permissionsQueryKey,
    queryFn: async () => {
      const { data } = await platformApi.admin.permissions();
      const payload = data as PermissionsResponse | PermissionRecord[];
      if (Array.isArray(payload)) {
        return payload;
      }
      return payload.permissions ?? [];
    },
    staleTime: 30_000,
  });

export const usePermissionMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: permissionsQueryKey });
  };

  const createPermission = useMutation({
    mutationFn: (payload: { module: string; action: string; name?: string; description?: string }) =>
      platformApi.admin.createPermission(payload),
    onSuccess: invalidate,
  });

  const deletePermission = useMutation({
    mutationFn: (id: string) => platformApi.admin.deletePermission(id),
    onSuccess: invalidate,
  });

  return { createPermission, deletePermission };
};

export const parsePermissionKey = (key: string): { module: string; action: string } | null => {
  const normalized = key.trim().toLowerCase();
  const dotIndex = normalized.indexOf(".");
  if (dotIndex <= 0 || dotIndex === normalized.length - 1) {
    return null;
  }
  return {
    module: normalized.slice(0, dotIndex),
    action: normalized.slice(dotIndex + 1),
  };
};
