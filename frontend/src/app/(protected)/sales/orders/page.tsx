"use client";

import { EnterpriseDocumentVoucher } from "@/components/erp/vouchers/EnterpriseDocumentVoucher";

export default function SalesOrdersPage() {
  return (
    <EnterpriseDocumentVoucher
      documentType="SALES_ORDER"
      title="Sales Order & Tax Invoicing Studio"
      defaultPrefix="SO"
    />
  );
}
