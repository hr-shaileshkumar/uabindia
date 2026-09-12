import type {
  BillDiscount,
  DiscountScheme,
  DocLine,
  MasterOption,
} from "../types";

export function asRows<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const box = payload as { data?: unknown; items?: unknown };
    if (Array.isArray(box.data)) return box.data as T[];
    if (Array.isArray(box.items)) return box.items as T[];
  }
  return [];
}

export function emptyDocLine(): DocLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 18,
    schemeId: "",
    schemeName: "",
    discountType: "",
    discountValue: 0,
  };
}

function catalogItemId(value?: string | null) {
  const id = String(value ?? "").trim();
  if (!id || id === "00000000-0000-0000-0000-000000000000") return "";
  return id;
}

export function docLinesFromApi(
  items?: Array<{
    itemId?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxRate?: number;
  }> | null,
): DocLine[] {
  if (!items?.length) return [emptyDocLine()];
  return items.map((item) => ({
    ...emptyDocLine(),
    itemId: catalogItemId(item.itemId),
    description: String(item.description ?? ""),
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.unitPrice ?? 0),
    taxRate: Number(item.taxRate ?? 18),
  }));
}

export function netLineRate(line: DocLine) {
  const list = line.unitPrice;
  if (line.discountType === "SpecialPrice" && line.discountValue > 0) return line.discountValue;
  if (line.discountType === "Percent" && line.discountValue > 0) {
    return Math.max(0, Math.round(list * (1 - line.discountValue / 100) * 100) / 100);
  }
  if (line.discountType === "Amount" && line.discountValue > 0) return Math.max(0, list - line.discountValue);
  return list;
}

export function lineAmounts(line: DocLine) {
  const taxable = Math.round(line.quantity * netLineRate(line) * 100) / 100;
  const tax = Math.round(taxable * (line.taxRate || 0) * 100) / 10000;
  return { taxable, tax, total: Math.round((taxable + tax) * 100) / 100 };
}

export function matchProductDiscount(
  item: MasterOption | undefined,
  quantity: number,
  schemes: DiscountScheme[],
) {
  if (!item?.id) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ranked = [...schemes].sort((left, right) => (right.priority || 0) - (left.priority || 0));
  for (const scheme of ranked) {
    if (scheme.status && scheme.status !== "Active") continue;
    const from = scheme.validFrom ? new Date(scheme.validFrom) : null;
    const to = scheme.validTo ? new Date(scheme.validTo) : null;
    if (from && from.setHours(0, 0, 0, 0) > today.getTime()) continue;
    if (to && to.setHours(0, 0, 0, 0) < today.getTime()) continue;
    if ((scheme.minQuantity || 0) > quantity) continue;
    const itemLine = scheme.lines?.find((line) => line.itemId === item.id);
    const categoryHit = [scheme.category, ...(scheme.lines || []).map((line) => line.category)].some(
      (category) => category && item.category && category.trim().toLowerCase() === item.category.trim().toLowerCase(),
    );
    const matches =
      scheme.scope === "AllItems" ||
      (scheme.scope === "Category" && categoryHit) ||
      (scheme.scope === "Items" && Boolean(itemLine || categoryHit));
    if (!matches) continue;
    return {
      schemeId: scheme.id,
      schemeName: scheme.schemeName,
      discountType: scheme.discountType,
      discountValue: Number(itemLine?.value ?? scheme.value ?? 0),
    };
  }
  return null;
}

export function formatSchemeDiscount(type?: string, value?: number) {
  const amount = value ?? 0;
  if (!type) return "—";
  if (type === "Percent") return amount > 0 ? `${amount}% off` : "—";
  if (type === "Amount") return amount > 0 ? `Rs ${amount} off` : "—";
  if (type === "SpecialPrice") return amount > 0 ? `Special Rs ${amount}` : "—";
  return amount > 0 ? String(amount) : "—";
}

export function hasUsableLine(line: DocLine) {
  return line.quantity > 0 && Boolean(line.itemId);
}

export function documentTotals(lines: DocLine[]) {
  return lines.filter(hasUsableLine).reduce(
    (sum, line) => {
      const amounts = lineAmounts(line);
      return {
        subTotal: sum.subTotal + amounts.taxable,
        taxAmount: sum.taxAmount + amounts.tax,
        total: sum.total + amounts.total,
      };
    },
    { subTotal: 0, taxAmount: 0, total: 0 },
  );
}

export function payloadLines(lines: DocLine[]) {
  return lines.filter(hasUsableLine).map((line) => ({
    itemId: line.itemId,
    description: line.description.trim() || undefined,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    taxRate: line.taxRate || 18,
  }));
}

export function emptyBillDiscount(): BillDiscount {
  return { kind: "none", percent: 5, amount: 0 };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function billDiscountAmount(billTotal: number, discount: BillDiscount) {
  const bill = Math.max(0, billTotal);
  if (discount.kind === "percent") {
    return roundMoney((bill * Math.max(0, discount.percent)) / 100);
  }
  if (discount.kind === "amount") {
    return roundMoney(Math.min(Math.max(0, discount.amount), bill));
  }
  return 0;
}

export function withBillDiscount(
  totals: { subTotal: number; taxAmount: number; total: number },
  discount: BillDiscount,
) {
  const discountAmount = billDiscountAmount(totals.total, discount);
  return {
    ...totals,
    discountAmount,
    netTotal: roundMoney(Math.max(0, totals.total - discountAmount)),
  };
}

export function formatInr(value?: number) {
  return `Rs ${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function gstSplit(taxAmount: number, placeOfSupply?: string, companyState?: string) {
  const inter = Boolean(
    placeOfSupply &&
      companyState &&
      placeOfSupply.trim().toUpperCase() !== companyState.trim().toUpperCase(),
  );
  if (inter) return { cgst: 0, sgst: 0, igst: taxAmount };
  return { cgst: taxAmount / 2, sgst: taxAmount / 2, igst: 0 };
}

export function numberToWordsInr(amount: number): string {
  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertSection(num: number): string {
    let result = "";
    if (num >= 100) {
      result += units[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      result += units[num] + " ";
    }
    return result.trim();
  }

  const rounded = Math.round(amount * 100) / 100;
  let integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  if (integerPart === 0) return "Rupees Zero Only";

  let words = "";

  // Crores
  if (integerPart >= 10000000) {
    words += convertSection(Math.floor(integerPart / 10000000)) + " Crore ";
    integerPart %= 10000000;
  }
  // Lakhs
  if (integerPart >= 100000) {
    words += convertSection(Math.floor(integerPart / 100000)) + " Lakh ";
    integerPart %= 100000;
  }
  // Thousands
  if (integerPart >= 1000) {
    words += convertSection(Math.floor(integerPart / 1000)) + " Thousand ";
    integerPart %= 1000;
  }
  // Hundreds & Remaining
  if (integerPart > 0) {
    words += convertSection(integerPart) + " ";
  }

  words = "Rupees " + words.trim();

  if (decimalPart > 0) {
    words += " and " + convertSection(decimalPart) + " Paise";
  }

  return words + " Only";
}
