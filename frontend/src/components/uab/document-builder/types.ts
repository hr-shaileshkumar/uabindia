export type MasterOption = {
  id: string;
  label: string;
  meta?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  taxRate?: number;
  hsnCode?: string;
  category?: string;
  state?: string;
  gstNumber?: string;
};

export type DiscountSchemeLine = {
  itemId?: string | null;
  category?: string | null;
  value?: number | null;
};

export type DiscountScheme = {
  id: string;
  schemeName: string;
  discountType: string;
  scope: string;
  value: number;
  priority: number;
  validFrom?: string;
  validTo?: string;
  minQuantity?: number;
  status?: string;
  category?: string | null;
  lines?: DiscountSchemeLine[];
};

export type DocLine = {
  key: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  schemeId: string;
  schemeName: string;
  discountType: string;
  discountValue: number;
};

export const BILL_DISCOUNT_PERCENTS = [5, 10, 12, 15, 18, 20, 25] as const;

export type BillDiscount = {
  kind: "none" | "percent" | "amount";
  percent: number;
  amount: number;
};

export const INDIA_STATE_CODES = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CT", "DL", "DN", "GA", "GJ", "HP", "HR", "JH", "JK",
  "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "PB", "PY", "RJ", "SK",
  "TN", "TS", "TR", "UP", "UK", "WB",
];
