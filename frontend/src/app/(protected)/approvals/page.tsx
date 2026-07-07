import { MappedRoutePage } from "@/components/erp/mapped-route-page";

export default function ApprovalsPage() {
  return (
    <MappedRoutePage
      eyebrow="Operations / Approvals"
      title="Approvals"
      notice="Approval routing now stays inside the shared protected shell. Use the linked workflow pages while deeper approval widgets are expanded."
    />
  );
}
