import { WorkspacePage } from "@/components/erp/workspace-page";

export default function DocumentsPage() {
  return (
    <WorkspacePage
      workspaceKey="hrms"
      crumbs={[
        { label: "ERP", href: "/erp/dashboard" },
        { label: "Documents" },
      ]}
    />
  );
}
