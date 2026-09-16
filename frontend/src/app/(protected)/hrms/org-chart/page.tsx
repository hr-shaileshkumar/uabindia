import { DynamicPage } from "@/components/dynamic/DynamicPage";
import OrgChartView from "@/features/hrms/components/OrgChartView";

export const metadata = {
  title: "Organization Hierarchy & Org Chart | UAB India",
  description: "Enterprise hierarchy mapping, tree visualization, transfer workflows, and delegation of authority.",
};

export default function OrgChartPage() {
  return (
    <DynamicPage
      pageKey="hrms.org-chart"
      fallback={<OrgChartView />}
      renderMode="auto"
    />
  );
}

