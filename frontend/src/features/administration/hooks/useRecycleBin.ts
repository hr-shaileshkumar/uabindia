import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "@/services/modules/administration";
import type { RecycleBinLogRecord, RecycleBinResponse } from "@/types";

const RETENTION_DAYS = 30;

export const recycleBinQueryKey = (page: number, limit: number, entity?: string) =>
  ["platform", "recycle-bin", page, limit, entity ?? "all"] as const;

export const useRecycleBin = (page = 1, limit = 50, entity?: string) =>
  useQuery({
    queryKey: recycleBinQueryKey(page, limit, entity),
    queryFn: async () => {
      const { data } = await platformApi.admin.recycleBin.listDeleted({ page, limit, entity });
      return data as RecycleBinResponse;
    },
    staleTime: 30_000,
  });

export const useRecycleBinMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["platform", "recycle-bin"] });
  };

  const restore = useMutation({
    mutationFn: ({ entityName, entityId }: { entityName: string; entityId: string }) =>
      platformApi.admin.recycleBin.restore(entityName, entityId),
    onSuccess: invalidate,
  });

  const hardDelete = useMutation({
    mutationFn: ({ entityName, entityId }: { entityName: string; entityId: string }) =>
      platformApi.admin.recycleBin.hardDelete(entityName, entityId),
    onSuccess: invalidate,
  });

  return { restore, hardDelete };
};

export const mapRecycleBinLog = (log: RecycleBinLogRecord) => {
  const deletedAt = new Date(log.performedAt);
  const retentionDaysLeft = Number.isNaN(deletedAt.getTime())
    ? RETENTION_DAYS
    : Math.max(0, RETENTION_DAYS - Math.floor((Date.now() - deletedAt.getTime()) / 86_400_000));

  return {
    id: log.id,
    entityType: log.entityName ?? "Unknown",
    entityId: log.entityId ?? "",
    displayName: log.entityId ? `${log.entityName ?? "Record"} · ${log.entityId}` : log.entityName ?? log.id,
    deletedBy: log.performedBy ?? undefined,
    deletedAt: Number.isNaN(deletedAt.getTime())
      ? log.performedAt
      : deletedAt.toLocaleDateString("en-IN"),
    retentionDaysLeft,
  };
};
