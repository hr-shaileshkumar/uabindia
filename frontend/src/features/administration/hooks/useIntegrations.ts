import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { IntegrationRecord, IntegrationSyncLogRecord, IntegrationsResponse } from "@/types";

export const integrationsQueryKey = ["platform", "integrations"] as const;

export const useIntegrations = () =>
  useQuery({
    queryKey: integrationsQueryKey,
    queryFn: async () => {
      const { data } = await appApi.licensing.integrations();
      const payload = data as IntegrationsResponse;
      return payload.integrations ?? [];
    },
    staleTime: 30_000,
  });

export const useIntegrationDetail = (id: string | null) =>
  useQuery({
    queryKey: [...integrationsQueryKey, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await appApi.licensing.getIntegration(id!);
      const payload = data as { data?: IntegrationRecord };
      return payload.data ?? (data as IntegrationRecord);
    },
  });

export const useIntegrationLogs = (id: string | null) =>
  useQuery({
    queryKey: [...integrationsQueryKey, "logs", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await appApi.licensing.integrationLogs(id!);
      const payload = data as { logs?: IntegrationSyncLogRecord[] };
      return payload.logs ?? [];
    },
  });

export const useIntegrationMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: integrationsQueryKey });

  const saveConfig = useMutation({
    mutationFn: ({ id, config }: { id: string; config: Record<string, string | null | undefined> }) =>
      appApi.licensing.upsertIntegrationConfig(id, config),
    onSuccess: () => void invalidate(),
  });

  const testConnection = useMutation({
    mutationFn: (id: string) => appApi.licensing.testIntegration(id),
    onSuccess: () => void invalidate(),
  });

  const sync = useMutation({
    mutationFn: (id: string) => appApi.licensing.syncIntegration(id),
    onSuccess: () => void invalidate(),
  });

  return { saveConfig, testConnection, sync };
};

export const mapIntegration = (item: IntegrationRecord, index: number) => ({
  id: item.id ?? `integration-${index}`,
  connectorKey: item.connectorKey ?? "",
  name: item.name ?? item.provider ?? "Integration",
  provider: item.provider ?? "Custom",
  status: item.status ?? "Inactive",
  category: item.category ?? "Connector",
  lastTestedAt: item.lastTestedAt ?? null,
  lastSyncAt: item.lastSyncAt ?? null,
  lastError: item.lastError ?? null,
});

export const connectorConfigFields = (connectorKey: string): { key: string; label: string; secret?: boolean; placeholder?: string }[] => {
  switch (connectorKey) {
    case "gst_portal":
      return [
        { key: "gstin", label: "GSTIN", placeholder: "15-character GSTIN" },
        { key: "username", label: "Portal username" },
        { key: "clientId", label: "Client ID" },
        { key: "clientSecret", label: "Client secret", secret: true },
      ];
    case "bank_feed":
      return [
        { key: "provider", label: "Provider", placeholder: "HDFC / ICICI / CSV" },
        { key: "accountId", label: "Account ID (GUID)" },
        { key: "accountCode", label: "Account code" },
        { key: "accountName", label: "Account name" },
        { key: "feedUrl", label: "Feed URL" },
        { key: "apiKey", label: "API key", secret: true },
      ];
    case "biometric_device":
      return [
        { key: "vendor", label: "Vendor", placeholder: "ZKTeco / eSSL" },
        { key: "deviceId", label: "Device ID" },
        { key: "deviceUrl", label: "Device URL" },
        { key: "apiKey", label: "API key", secret: true },
      ];
    default:
      return [{ key: "notes", label: "Notes" }];
  }
};
