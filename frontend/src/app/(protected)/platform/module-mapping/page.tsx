"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal, Layers, ShieldCheck, Compass, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { ErpRowActions } from "@/components/workspace/page-kit";
import { erpButtonClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { appApi } from "@/services/modules/app";
import { enabledModulesQueryKey } from "@/features/platform/hooks/useEnabledModules";
import { useUiSchema } from "@/context/UiSchemaContext";

type CatalogModule = {
  key: string;
  name: string;
  displayName?: string;
  description?: string;
  basePath?: string;
  isEnabled: boolean;
};

const catalogQueryKey = ["platform", "modules", "catalog"] as const;

export default function ModuleMappingPage() {
  const queryClient = useQueryClient();
  const { refresh: refreshUiSchema } = useUiSchema();
  const [search, setSearch] = useState("");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: catalogQueryKey,
    queryFn: async () => {
      const { data: payload } = await appApi.modules.catalog();
      const modules = (payload as { modules?: CatalogModule[] })?.modules;
      return Array.isArray(modules) ? modules : [];
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ moduleKey, isEnabled }: { moduleKey: string; isEnabled: boolean }) => {
      await appApi.modules.updateSubscriptions({
        subscriptions: [{ moduleKey, isEnabled }],
      });
    },
    onMutate: ({ moduleKey }) => setTogglingKey(moduleKey),
    onSuccess: async (_, vars) => {
      notifySuccess(
        vars.isEnabled ? `${vars.moduleKey} enabled` : `${vars.moduleKey} disabled`,
        "Module Enablement",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: catalogQueryKey }),
        queryClient.invalidateQueries({ queryKey: enabledModulesQueryKey }),
        refreshUiSchema(),
      ]);
    },
    onError: (err) => {
      notifyError(getApiErrorMessage(err, "Failed to update module subscription."), "Module Enablement");
    },
    onSettled: () => setTogglingKey(null),
  });

  const filteredModules = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((m) => {
      const title = (m.displayName || m.name || "").toLowerCase();
      return (
        !q ||
        title.includes(q) ||
        m.key.toLowerCase().includes(q) ||
        (m.basePath || "").toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const enabledCount = data.filter((m) => m.isEnabled).length;

  const kpis: KpiMetricItem[] = [
    { label: "Catalog Modules", value: data.length, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Enabled", value: enabledCount, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Disabled", value: data.length - enabledCount, tone: "warning", icon: <Compass className="h-3.5 w-3.5" />, subtext: "Hidden from nav" },
    { label: "Enforcement", value: "API + Nav", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Module policies" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Module Enablement"
      subtitle="Enable or disable ERP modules for this tenant. Disabled modules are hidden from navigation and blocked by Module:* API policies."
      categoryTag="Subsystem Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter module key, name, or route..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-module-mapping"
      listRows={filteredModules}
      getRowId={(row) => row.key}
      emptyMessage={
        isError
          ? getApiErrorMessage(error, "Failed to load module catalog.")
          : "No modules found in catalog."
      }
      listColumns={[
        { key: "key", label: "Module Key", dataType: "string" },
        { key: "displayName", label: "Display Title", dataType: "string" },
        { key: "basePath", label: "Base Route", dataType: "string" },
        { key: "isEnabled", label: "Status", dataType: "boolean" },
        { key: "actions", label: "Actions", locked: true },
      ]}
      renderListRow={(m) => {
        const busy = togglingKey === m.key;
        return (
          <>
            <td className="erp-td font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
              {m.key}
            </td>
            <td className="erp-td font-semibold text-xs">
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                {m.displayName || m.name}
              </span>
            </td>
            <td className="erp-td font-mono text-xs">{m.basePath || "—"}</td>
            <td className="erp-td">
              <Badge variant={m.isEnabled ? "default" : "secondary"}>
                {m.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </td>
            <td className="erp-td">
              <ErpRowActions
                extra={
                  <button
                    type="button"
                    disabled={busy || toggleMutation.isPending}
                    onClick={() =>
                      toggleMutation.mutate({ moduleKey: m.key, isEnabled: !m.isEnabled })
                    }
                    className={`${erpButtonClassName.secondary} h-8 px-2 text-xs`}
                  >
                    {busy ? "Saving…" : m.isEnabled ? "Disable" : "Enable"}
                  </button>
                }
              />
            </td>
          </>
        );
      }}
    />
  );
}
