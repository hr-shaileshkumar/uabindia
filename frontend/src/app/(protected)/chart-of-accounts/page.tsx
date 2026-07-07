import { MappedRoutePage } from "@/components/erp/mapped-route-page";

export default function FinancePage() {
  return (
    <MappedRoutePage
      eyebrow="Finance / Ledger Setup"
      title="Chart of Accounts"
      notice="This route now uses the common SaaS shell instead of mock workspace content, while the deeper finance workflows continue to expand through the centralized API facade."
    />
  );
}
