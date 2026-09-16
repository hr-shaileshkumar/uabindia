"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { ProjectTasksManager } from "@/features/projects/components/ProjectTasksManager";

export default function ProjectTasksPage() {
  return (
    <DynamicPage
      pageKey="projects.tasks"
      fallback={<ProjectTasksManager />}
      renderMode="auto"
    />
  );
}

