import { useQuery } from "@tanstack/react-query";
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

export const mapCommunicationTemplate = (template: CommunicationTemplateRecord) => ({
  id: template.id,
  key: template.triggerEvent || template.name,
  channel: template.templateKind?.toLowerCase().includes("sms")
    ? ("SMS" as const)
    : ("Email" as const),
  subject: template.subject || template.name,
  language: template.language || "en-US",
  isActive: template.status?.toLowerCase() !== "draft",
  name: template.name,
});

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
