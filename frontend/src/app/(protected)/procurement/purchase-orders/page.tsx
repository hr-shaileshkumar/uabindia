"use client";

import { EnterpriseDocumentVoucher } from "@/components/erp/vouchers/EnterpriseDocumentVoucher";

export default function ProcurementPurchaseOrdersPage() {
  return (
    <EnterpriseDocumentVoucher
      documentType="PURCHASE_ORDER"
      title="Purchase Order Studio"
      defaultPrefix="PO"
    />
  );
}
