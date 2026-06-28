import { WorkspacePage } from "@/components/erp/workspace-page";

export default function ProjectsPage() {
  return (
    <WorkspacePage
      workspaceKey="projects"
      crumbs={[
        { label: "ERP", href: "/erp/dashboard" },
        { label: "Projects" },
      ]}
    />
  );
}
