import { WorkspacePage } from "@/components/erp/workspace-page";

export default function ApprovalsPage() {
  return (
    <WorkspacePage
      workspaceKey="approvals"
      crumbs={[
        { label: "ERP", href: "/erp/dashboard" },
        { label: "Approvals" },
      ]}
    />
  );
}
