import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { DocumentRecord } from "@/types";

export const documentsQueryKey = (module?: string, category?: string) =>
  ["documents", module ?? "all", category ?? "all"] as const;

export const useDocuments = (module?: string, category?: string) =>
  useQuery({
    queryKey: documentsQueryKey(module, category),
    queryFn: async () => {
      const { data } = await appApi.documents.list({ module, category });
      return (Array.isArray(data) ? data : []) as DocumentRecord[];
    },
    staleTime: 30_000,
  });

export const mapDocumentRecord = (doc: DocumentRecord) => ({
  id: doc.id,
  title: doc.fileName,
  category: (doc.category ?? "General") as "Letter Template" | "Policy Document" | "Certificate" | "ID Card" | "General",
  digitalSignatureRequired: false,
  version: "v1",
  updatedAt: formatDocumentDate(doc.createdAt),
  module: doc.module ?? "general",
});

const formatDocumentDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN");
};
