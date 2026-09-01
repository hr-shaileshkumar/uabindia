import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { EntityFieldDefinitionRecord, EntityFieldDefinitionsResponse } from "@/types";

export const entityFieldDefinitionsQueryKey = ["platform", "entity-field-definitions"] as const;

export const useEntityFieldDefinitions = () =>
  useQuery({
    queryKey: entityFieldDefinitionsQueryKey,
    queryFn: async () => {
      const { data } = await appApi.entityFields.getAllDefinitions();
      const payload = data as EntityFieldDefinitionsResponse;
      return payload.definitions ?? [];
    },
    staleTime: 30_000,
  });

export const useEntityFieldMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: entityFieldDefinitionsQueryKey });
  };

  const createDefinition = useMutation({
    mutationFn: (payload: Parameters<typeof appApi.entityFields.createDefinition>[0]) =>
      appApi.entityFields.createDefinition(payload),
    onSuccess: invalidate,
  });

  const updateDefinition = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof appApi.entityFields.updateDefinition>[1] }) =>
      appApi.entityFields.updateDefinition(id, payload),
    onSuccess: invalidate,
  });

  const deleteDefinition = useMutation({
    mutationFn: (id: string) => appApi.entityFields.deleteDefinition(id),
    onSuccess: invalidate,
  });

  return { createDefinition, updateDefinition, deleteDefinition };
};

export const mapEntityFieldDefinition = (field: EntityFieldDefinitionRecord) => ({
  id: field.id,
  entityName: field.entityName,
  fieldName: field.fieldLabel || field.fieldKey,
  fieldKey: field.fieldKey,
  fieldLabel: field.fieldLabel,
  dataType: normalizeFieldType(field.fieldType),
  fieldType: field.fieldType,
  isRequired: field.isRequired,
  isSearchable: field.isActive,
  section: field.section ?? "General",
});

const normalizeFieldType = (
  value: string
): "String" | "Number" | "Boolean" | "DateTime" | "JSON" => {
  const normalized = value.toLowerCase();
  if (normalized.includes("number") || normalized.includes("int") || normalized.includes("decimal")) {
    return "Number";
  }
  if (normalized.includes("bool")) return "Boolean";
  if (normalized.includes("date")) return "DateTime";
  if (normalized.includes("json")) return "JSON";
  return "String";
};
