import { MappedRoutePage } from "@/components/erp/mapped-route-page";

export function AdministrationDocumentsPage() {
  return (
    <MappedRoutePage
      eyebrow="Administration / Documents"
      title="Documents"
      notice="Document routing now stays inside the administration workspace so shared records follow the same module, submodule, and page structure."
    />
  );
}
