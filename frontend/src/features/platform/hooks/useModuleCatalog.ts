import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { ModuleCatalogResponse } from "@/types";

export const moduleCatalogQueryKey = ["platform", "modules", "catalog"] as const;

export const useModuleCatalog = () =>
  useQuery({
    queryKey: moduleCatalogQueryKey,
    queryFn: async () => {
      const { data } = await appApi.modules.catalog();
      const payload = data as ModuleCatalogResponse;
      return payload.modules ?? [];
    },
    staleTime: 60_000,
  });

export const mapModuleCatalogItem = (module: { key: string; name: string; isEnabled: boolean; version?: string }) => ({
  id: module.key,
  planCode: module.key.toUpperCase(),
  planName: module.name,
  version: module.version ?? "1.0",
  isActive: module.isEnabled,
  billingCycle: "Monthly",
  seatLimit: "Unlimited",
});
