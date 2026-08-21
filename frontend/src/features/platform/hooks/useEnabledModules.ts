import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { EnabledModuleRecord, EnabledModulesResponse } from "@/types";

export const enabledModulesQueryKey = ["platform", "modules", "enabled"] as const;

export const useEnabledModules = () =>
  useQuery({
    queryKey: enabledModulesQueryKey,
    queryFn: async () => {
      const { data } = await appApi.modules.getEnabled();
      const payload = data as EnabledModulesResponse;
      return payload.modules ?? [];
    },
    staleTime: 60_000,
  });

export const mapEnabledModule = (module: EnabledModuleRecord) => ({
  id: module.key,
  moduleKey: module.key.toUpperCase(),
  displayName: module.displayName || module.name,
  routePath: module.basePath ?? "/",
  isEnabled: module.isEnabled,
  requiredRole: "Tenant Admin",
});
