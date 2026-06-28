import { WorkspacePage } from "@/components/erp/workspace-page";

export default function ShiftPage() {
  return (
    <WorkspacePage
      workspaceKey="attendance"
      crumbs={[
        { label: "ERP", href: "/erp/dashboard" },
        { label: "Roster & Shifts" },
      ]}
    />
  );
}
