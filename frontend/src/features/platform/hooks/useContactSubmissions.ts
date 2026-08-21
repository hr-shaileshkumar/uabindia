import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "@/services/modules/platform";
import type { ContactSubmissionRecord, ContactSubmissionsResponse } from "@/types";

export const contactSubmissionsQueryKey = (page: number, limit: number) =>
  ["platform", "contact-submissions", page, limit] as const;

export const useContactSubmissions = (page = 1, limit = 25) =>
  useQuery({
    queryKey: contactSubmissionsQueryKey(page, limit),
    queryFn: async () => {
      const { data } = await platformApi.admin.contactSubmissions.list(page, limit);
      return data as ContactSubmissionsResponse;
    },
    staleTime: 30_000,
  });

export const useContactSubmissionMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["platform", "contact-submissions"] });
  };

  const updateResolved = useMutation({
    mutationFn: ({ id, isResolved }: { id: string; isResolved: boolean }) =>
      platformApi.admin.contactSubmissions.update(id, { isResolved }),
    onSuccess: invalidate,
  });

  return { updateResolved };
};

export const mapContactSubmission = (record: ContactSubmissionRecord) => ({
  id: record.id,
  name: record.name,
  email: record.email,
  phone: record.phoneNumber ?? undefined,
  companyName: record.companyName ?? undefined,
  subject: record.subject ?? undefined,
  message: record.message,
  status: record.isResolved ? ("Resolved" as const) : ("New" as const),
  createdAt: formatSubmissionDate(record.createdAt),
});

const formatSubmissionDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
