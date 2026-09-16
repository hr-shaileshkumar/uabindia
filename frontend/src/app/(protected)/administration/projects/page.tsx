"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { AdministrationProjectsManager } from "@/features/administration/components/AdministrationProjectsManager";

export default function ProjectsPage() {
  return (
    <DynamicPage
      pageKey="administration.projects"
      fallback={<AdministrationProjectsManager />}
      renderMode="auto"
    />
  );
}

