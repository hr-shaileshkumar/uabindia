import { WorkspacePage } from "@/components/erp/workspace-page";

export default function FinancePage() {
  return (
    <WorkspacePage
      workspaceKey="finance"
      crumbs={[
        { label: "ERP", href: "/erp/dashboard" },
        { label: "Finance" },
      ]}
    />
  );
}
