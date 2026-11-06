export type ReturnRow = {
  id: string;
  returnNumber?: string;
  customerId?: string;
  customerName?: string;
  originalOrderRef?: string;
  amount?: number;
  reason?: string;
  returnDate?: string;
  status?: string;
  creditNoteNumber?: string;
  soNumber?: string;
  totalAmount?: number;
  soDate?: string;
};

export type ReturnForm = {
  customerId: string;
  originalOrderRef: string;
  amount: number;
  reason: string;
  returnDate: string;
};

export const RETURN_REASONS = [
  "Defective Product",
  "Wrong Item Delivered",
  "Damaged in Transit",
  "Customer Changed Mind",
  "Quantity Mismatch",
  "Quality Issue",
  "Other",
] as const;
