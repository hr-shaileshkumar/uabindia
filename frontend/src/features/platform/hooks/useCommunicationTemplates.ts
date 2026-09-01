import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { CommunicationTemplateRecord, CommunicationTemplatesResponse } from "@/types";

export const emailTemplatesQueryKey = (page: number, limit: number) =>
  ["platform", "email-templates", page, limit] as const;

export const smsTemplatesQueryKey = (page: number, limit: number) =>
  ["platform", "sms-templates", page, limit] as const;

export const useEmailTemplates = (page = 1, limit = 50) =>
  useQuery({
    queryKey: emailTemplatesQueryKey(page, limit),
    queryFn: async () => {
      const { data } = await appApi.communication.emailTemplates.list({ page, limit });
      return data as CommunicationTemplatesResponse;
    },
    staleTime: 30_000,
  });

export const useSmsTemplates = (page = 1, limit = 50) =>
  useQuery({
    queryKey: smsTemplatesQueryKey(page, limit),
    queryFn: async () => {
      const { data } = await appApi.communication.smsTemplates.list({ page, limit });
      return data as CommunicationTemplatesResponse;
    },
    staleTime: 30_000,
  });

export const mapCommunicationTemplate = (template: CommunicationTemplateRecord) => {
  const record = template as unknown as Record<string, unknown>;
  return {
    id: template.id,
    key: template.triggerEvent || template.name,
    channel: (template.templateKind?.toLowerCase().includes("sms")
      ? "SMS"
      : "Email") as "SMS" | "Email",
    subject: template.subject || template.name,
    body: (record.body as string) || "",
    triggerEvent: template.triggerEvent || "",
    language: template.language || "en-US",
    isActive: template.status?.toLowerCase() !== "draft",
    name: template.name,
  };
};

export const useNotificationTemplates = (page = 1, limit = 50) => {
  const email = useEmailTemplates(page, limit);
  const sms = useSmsTemplates(page, limit);

  const templates = [
    ...(email.data?.records ?? []).map(mapCommunicationTemplate),
    ...(sms.data?.records ?? []).map(mapCommunicationTemplate),
  ];

  return {
    templates,
    isLoading: email.isLoading || sms.isLoading,
    isError: email.isError || sms.isError,
    error: email.error ?? sms.error,
    refetch: async () => {
      await Promise.all([email.refetch(), sms.refetch()]);
    },
    total: (email.data?.total ?? 0) + (sms.data?.total ?? 0),
  };
};

export const useTemplateMutations = () => {
  const queryClient = useQueryClient();

  const createTemplate = useMutation({
    mutationFn: async ({
      kind,
      name,
      subject,
      body,
      triggerEvent,
      language,
      status,
    }: {
      kind: "Email" | "SMS";
      name: string;
      subject?: string;
      body: string;
      triggerEvent?: string;
      language?: string;
      status?: string;
    }) => {
      const payload = { name, subject, body, triggerEvent, language, status: status || "Published" };
      if (kind === "Email") {
        return appApi.communication.emailTemplates.create(payload);
      } else {
        return appApi.communication.smsTemplates.create(payload);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "email-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "sms-templates"] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async ({ kind, id }: { kind: "Email" | "SMS"; id: string }) => {
      if (kind === "Email") {
        return appApi.communication.emailTemplates.delete(id);
      } else {
        return appApi.communication.smsTemplates.delete(id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "email-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "sms-templates"] });
    },
  });

  return { createTemplate, deleteTemplate };
};
