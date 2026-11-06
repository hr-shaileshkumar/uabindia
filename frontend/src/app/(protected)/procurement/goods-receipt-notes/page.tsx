"use client";

import { EnterpriseDocumentVoucher } from "@/components/erp/vouchers/EnterpriseDocumentVoucher";

export default function GoodsReceiptNotesPage() {
  return (
    <EnterpriseDocumentVoucher
      documentType="GOODS_RECEIPT"
      title="Goods Receipt Note (GRN) Studio"
      defaultPrefix="GRN"
    />
  );
}
