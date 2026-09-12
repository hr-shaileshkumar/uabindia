import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { WorkflowDefinitionRecord, WorkflowDefinitionsResponse } from "@/types";

export const workflowDefinitionsQueryKey = ["platform", "workflow-definitions"] as const;

export const useWorkflowDefinitions = () =>
  useQuery({
    queryKey: workflowDefinitionsQueryKey,
    queryFn: async () => {
      const { data } = await appApi.workflows.listDefinitions();
      const payload = data as WorkflowDefinitionsResponse;
      return payload.definitions ?? [];
    },
    staleTime: 30_000,
  });

export const useWorkflowMutations = () => {
  const queryClient = useQueryClient();

  const upsertWorkflow = useMutation({
    mutationFn: async (payload: { key: string; name: string; isActive: boolean; steps: { stepNumber: number; roleRequired: string; conditionType?: string }[] }) => {
      return await appApi.workflows.upsert(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowDefinitionsQueryKey });
    },
  });

  return { upsertWorkflow };
};

export const mapWorkflowDefinition = (workflow: WorkflowDefinitionRecord) => ({
  id: workflow.id,
  workflowKey: workflow.key,
  name: workflow.name,
  module: workflow.key,
  steps: workflow.steps?.length ?? 0,
  status: workflow.isActive ? ("Active" as const) : ("Inactive" as const),
  approvalRoles: workflow.steps?.map((step) => step.roleRequired).filter(Boolean).join(", ") ?? "—",
});
