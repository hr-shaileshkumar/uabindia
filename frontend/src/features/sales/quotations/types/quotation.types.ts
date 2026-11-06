export type QuotationRow = {
  id: string;
  quoteNumber?: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
  validUntil?: string;
  createdDate?: string;
  status?: string;
  notes?: string;
  soNumber?: string;
  totalAmount?: number;
  expectedDeliveryDate?: string;
  soDate?: string;
};

export type QuoteForm = {
  customerId: string;
  validUntil: string;
  notes: string;
};

export const QUOTATION_STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Draft: { chip: "erp-chip erp-chip-neutral", label: "Draft" },
  Sent: { chip: "erp-chip erp-chip-info", label: "Sent" },
  Pending: { chip: "erp-chip erp-chip-warning", label: "Pending" },
  Accepted: { chip: "erp-chip erp-chip-success", label: "Accepted" },
  Rejected: { chip: "erp-chip erp-chip-danger", label: "Rejected" },
  Expired: { chip: "erp-chip erp-chip-neutral", label: "Expired" },
};
