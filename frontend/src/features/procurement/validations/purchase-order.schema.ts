import { z } from "zod";

export const purchaseOrderLineSchema = z.object({
  itemId: z.string().min(1, "Item selection is required"),
  description: z.string().optional(),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discountPercent: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").default(0),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").default(0),
});

export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>;

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor selection is required"),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDeliveryDate: z.string().optional(),
  currency: z.string().min(1).default("INR"),
  notes: z.string().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, "At least one order line item is required"),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export interface ComputedLineAmounts {
  taxable: number;
  tax: number;
  total: number;
}

export function calculateLineAmounts(line: {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
}): ComputedLineAmounts {
  const discount = Number(line.discountPercent) || 0;
  const netRate = Math.max(0, Math.round(line.unitPrice * (1 - discount / 100) * 100) / 100);
  const taxable = Math.round(line.quantity * netRate * 100) / 100;
  const tax = Math.round(taxable * (Number(line.taxRate) || 0) * 100) / 10000;
  const total = Math.round((taxable + tax) * 100) / 100;
  return { taxable, tax, total };
}

export interface ComputedDocumentTotals {
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
}

export function calculateDocumentTotals(
  lines: Array<{
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxRate?: number;
  }>,
): ComputedDocumentTotals {
  return lines.reduce(
    (acc, line) => {
      const calc = calculateLineAmounts(line);
      return {
        subtotal: Math.round((acc.subtotal + calc.taxable) * 100) / 100,
        taxTotal: Math.round((acc.taxTotal + calc.tax) * 100) / 100,
        grandTotal: Math.round((acc.grandTotal + calc.total) * 100) / 100,
      };
    },
    { subtotal: 0, taxTotal: 0, grandTotal: 0 },
  );
}

export function validatePurchaseOrder(payload: unknown): {
  success: boolean;
  data?: PurchaseOrderInput;
  totals?: ComputedDocumentTotals;
  error?: string;
  errors?: string[];
} {
  const result = purchaseOrderSchema.safeParse(payload);
  if (result.success) {
    const totals = calculateDocumentTotals(result.data.lines);
    return { success: true, data: result.data, totals };
  }

  const issues = result.error.issues;
  const errors = issues.map((issue) => issue.message);
  return {
    success: false,
    error: errors[0] ?? "Validation failed",
    errors,
  };
}
