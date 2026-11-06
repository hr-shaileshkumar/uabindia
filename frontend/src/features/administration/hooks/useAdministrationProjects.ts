import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgApi } from "@/services/modules/org";
import type { Project } from "@/types";

export const projectsQueryKey = (companyId?: string | null, status?: string) =>
  ["platform", "projects", companyId ?? "all", status ?? "all"] as const;

export const useAdministrationProjects = (companyId?: string | null, status?: string) =>
  useQuery({
    queryKey: projectsQueryKey(companyId, status),
    queryFn: async () => {
      const { data } = await orgApi.project.getAll(companyId ?? undefined, status);
      return data.projects ?? [];
    },
    staleTime: 30_000,
  });

export const useProjectMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["platform", "projects"] });
  };

  const createProject = useMutation({
    mutationFn: (payload: Parameters<typeof orgApi.project.create>[0]) => orgApi.project.create(payload),
    onSuccess: invalidate,
  });

  const updateProject = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof orgApi.project.update>[1] }) =>
      orgApi.project.update(id, payload),
    onSuccess: invalidate,
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => orgApi.project.delete(id),
    onSuccess: invalidate,
  });

  return { createProject, updateProject, deleteProject };
};

export const mapProjectToRow = (project: Project) => ({
  id: project.id,
  code: project.projectCode,
  name: project.name,
  client: project.clientName ?? project.companyName ?? "—",
  budget: project.budget ?? 0,
  status: normalizeProjectStatus(project.status),
  completion: project.completionPercentage ?? 0,
  updatedAt: project.updatedAt ?? project.createdAt ?? "",
});

const normalizeProjectStatus = (status?: string | null): "In Progress" | "Completed" | "On Hold" | "Planning" => {
  const value = (status ?? "").toLowerCase();
  if (value.includes("complete")) return "Completed";
  if (value.includes("hold")) return "On Hold";
  if (value.includes("plan")) return "Planning";
  return "In Progress";
};

export { useAdministrationProjects as usePlatformProjects };
