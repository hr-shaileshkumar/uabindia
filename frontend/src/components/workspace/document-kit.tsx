"use client";

import { useEffect, useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";
import { crmApi, financeApi, inventoryApi, procurementApi, salesApi } from "@/services/modules";

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

export function docLinesFromApi(items?: Array<{
  itemId?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
}> | null): DocLine[] {
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

export function lineAmounts(line: DocLine) {
  const taxable = Math.round(line.quantity * netLineRate(line) * 100) / 100;
  const tax = Math.round(taxable * (line.taxRate || 0) * 100) / 10000;
  return { taxable, tax, total: Math.round((taxable + tax) * 100) / 100 };
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

export function matchProductDiscount(item: MasterOption | undefined, quantity: number, schemes: DiscountScheme[]) {
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

export const BILL_DISCOUNT_PERCENTS = [5, 10, 12, 15, 18, 20, 25] as const;

export type BillDiscount = {
  kind: "none" | "percent" | "amount";
  percent: number;
  amount: number;
};

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

export const INDIA_STATE_CODES = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CT", "DL", "DN", "GA", "GJ", "HP", "HR", "JH", "JK",
  "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "PB", "PY", "RJ", "SK",
  "TN", "TS", "TR", "UP", "UK", "WB",
];

export function formatInr(value?: number) {
  return `Rs ${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function asRecordRows(payload: unknown): Record<string, unknown>[] {
  return asRows<Record<string, unknown>>(payload);
}

export function mapCustomerOptions(payload: unknown): MasterOption[] {
  return asRecordRows(payload).map((row) => ({
    id: String(row.id),
    label: String(row.customerName ?? row.name ?? "Customer"),
    meta: String(row.customerCode ?? row.gstNumber ?? ""),
    state: row.state ? String(row.state) : undefined,
    gstNumber: row.gstNumber ? String(row.gstNumber) : undefined,
  }));
}

export function mapVendorOptions(payload: unknown): MasterOption[] {
  return asRecordRows(payload).map((row) => ({
    id: String(row.id),
    label: String(row.vendorName ?? row.name ?? "Vendor"),
    meta: String(row.vendorCode ?? row.gstNumber ?? ""),
    state: row.state ? String(row.state) : undefined,
    gstNumber: row.gstNumber ? String(row.gstNumber) : undefined,
  }));
}

export function mapItemOptions(payload: unknown): MasterOption[] {
  return asRecordRows(payload).map((row) => ({
    id: String(row.id),
    label: `${row.itemCode ? `${row.itemCode} ` : ""}${row.itemName ?? row.name ?? "Item"}`.trim(),
    meta: row.hsnCode ? String(row.hsnCode) : undefined,
    sellingPrice: Number(row.sellingPrice ?? 0),
    purchasePrice: Number(row.purchasePrice ?? 0),
    taxRate: Number(row.taxRate ?? 18),
    hsnCode: row.hsnCode ? String(row.hsnCode) : undefined,
    category: row.category ? String(row.category) : undefined,
  }));
}

export function mapAccountOptions(payload: unknown): MasterOption[] {
  return asRecordRows(payload)
    .filter((row) => row.isGroup !== true)
    .map((row) => ({
      id: String(row.id),
      label: `${row.accountCode ? `${row.accountCode} ` : ""}${row.accountName ?? row.name ?? "Account"}`.trim(),
      meta: row.accountType ? String(row.accountType) : undefined,
    }));
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

export function useDocumentMasters() {
  const [customers, setCustomers] = useState<MasterOption[]>([]);
  const [vendors, setVendors] = useState<MasterOption[]>([]);
  const [items, setItems] = useState<MasterOption[]>([]);
  const [accounts, setAccounts] = useState<MasterOption[]>([]);
  const [schemes, setSchemes] = useState<DiscountScheme[]>([]);

  useEffect(() => {
    const load = () => {
      void Promise.all([
        crmApi.customers.getAll(1, 200).catch(() => ({ data: [] })),
        procurementApi.vendors.getAll(1, 200).catch(() => ({ data: [] })),
        inventoryApi.items.getAll(1, 200).catch(() => ({ data: [] })),
        financeApi.chartOfAccounts.getAll().catch(() => ({ data: [] })),
        salesApi.discounts.getActive().catch(() => ({ data: [] })),
      ]).then(([customerRes, vendorRes, itemRes, accountRes, schemeRes]) => {
        setCustomers(mapCustomerOptions(customerRes.data));
        setVendors(mapVendorOptions(vendorRes.data));
        setItems(mapItemOptions(itemRes.data));
        setAccounts(mapAccountOptions(accountRes.data));
        setSchemes(asRows<DiscountScheme>(schemeRes.data));
      });
    };

    load();
    window.addEventListener("erp:org-context-changed", load);
    return () => window.removeEventListener("erp:org-context-changed", load);
  }, []);

  return { customers, vendors, items, accounts, schemes };
}

export function ErpMasterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (id: string, option?: MasterOption) => void;
  options: MasterOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="erp-label">{label}</label>
      <select
        className="erp-select mt-1"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const id = event.target.value;
          onChange(id, options.find((option) => option.id === id));
        }}
      >
        <option value="">{placeholder || "Select…"}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.meta ? ` — ${option.meta}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatLineNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  return String(value);
}

function LineNumberInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(() => formatLineNumber(value));

  useEffect(() => {
    if (!focused) setRaw(formatLineNumber(value));
  }, [value, focused]);

  return (
    <input
      className="erp-input erp-line-num"
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={raw}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setRaw(formatLineNumber(value));
      }}
      onChange={(event) => {
        const next = event.target.value.replace(/,/g, "");
        if (next !== "" && !/^\d*[.]?\d*$/.test(next)) return;
        setRaw(next);
        if (next === "" || next === ".") {
          onChange(0);
          return;
        }
        const parsed = Number(next);
        if (Number.isFinite(parsed)) onChange(parsed);
      }}
    />
  );
}

export function ErpLineGrid({
  lines,
  onChange,
  items,
  priceField,
  schemes = [],
}: {
  lines: DocLine[];
  onChange: (next: DocLine[]) => void;
  items: MasterOption[];
  priceField?: "sellingPrice" | "purchasePrice";
  schemes?: DiscountScheme[];
}) {
  const field = priceField || "sellingPrice";
  const applySchemes = field === "sellingPrice" && schemes.length > 0;

  const schemePatch = (item: MasterOption | undefined, quantity: number): Partial<DocLine> => {
    if (!applySchemes) return { schemeId: "", schemeName: "", discountType: "", discountValue: 0 };
    const match = matchProductDiscount(item, quantity, schemes);
    return {
      schemeId: match?.schemeId || "",
      schemeName: match?.schemeName || "",
      discountType: match?.discountType || "",
      discountValue: match?.discountValue || 0,
    };
  };

  const update = (key: string, patch: Partial<DocLine>) => {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  return (
    <div className="erp-line-grid space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">Lines</p>
        <button
          type="button"
          className={`${erpButtonClassName.secondary} text-xs`}
          onClick={() => onChange([...lines, emptyDocLine()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-2 py-2 min-w-[16rem]">Item</th>
              <th className="px-2 py-2 w-24">Qty</th>
              <th className="px-2 py-2 w-28">Rate</th>
              <th className="px-2 py-2 w-24">Discount</th>
              <th className="px-2 py-2 w-24">GST %</th>
              <th className="px-2 py-2 w-28 text-right">Amount</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const amounts = lineAmounts(line);
              return (
                <tr key={line.key} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 min-w-[16rem]">
                    <select
                      className="erp-select"
                      value={line.itemId}
                      onChange={(event) => {
                        const item = items.find((row) => row.id === event.target.value);
                        update(line.key, {
                          itemId: event.target.value,
                          description: item?.label || "",
                          unitPrice: item?.[field] ?? line.unitPrice,
                          taxRate: item?.taxRate ?? line.taxRate,
                          ...schemePatch(item, line.quantity),
                        });
                      }}
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {line.schemeName ? (
                      <p className="mt-1 text-[11px] text-emerald-700">{line.schemeName}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 w-24">
                    <LineNumberInput
                      ariaLabel="Quantity"
                      value={line.quantity}
                      onChange={(quantity) => {
                        const item = items.find((row) => row.id === line.itemId);
                        update(line.key, { quantity, ...schemePatch(item, quantity) });
                      }}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-28">
                    <LineNumberInput
                      ariaLabel="Rate"
                      value={line.unitPrice}
                      onChange={(unitPrice) => update(line.key, { unitPrice })}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-24 text-xs text-slate-600">
                    {formatSchemeDiscount(line.discountType, line.discountValue)}
                  </td>
                  <td className="px-2 py-1.5 w-24">
                    <LineNumberInput
                      ariaLabel="GST percent"
                      value={line.taxRate}
                      onChange={(taxRate) => update(line.key, { taxRate })}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium">{formatInr(amounts.total)}</td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      disabled={lines.length <= 1}
                      onClick={() => onChange(lines.filter((row) => row.key !== line.key))}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ErpTotalsStrip({
  subTotal,
  taxAmount,
  total,
  cgst,
  sgst,
  igst,
  discount,
  onDiscountChange,
}: {
  subTotal: number;
  taxAmount: number;
  total: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  discount: BillDiscount;
  onDiscountChange: (next: BillDiscount) => void;
}) {
  const billed = withBillDiscount({ subTotal, taxAmount, total }, discount);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-500">Taxable</span>
        <span className="tabular-nums">{formatInr(subTotal)}</span>
      </div>
      {igst ? (
        <div className="flex justify-between">
          <span className="text-slate-500">IGST</span>
          <span className="tabular-nums">{formatInr(igst)}</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between">
            <span className="text-slate-500">CGST</span>
            <span className="tabular-nums">{formatInr(cgst ?? taxAmount / 2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">SGST</span>
            <span className="tabular-nums">{formatInr(sgst ?? taxAmount / 2)}</span>
          </div>
        </>
      )}
      <div className="mt-1 flex justify-between font-semibold text-slate-900">
        <span>Total</span>
        <span className="tabular-nums">{formatInr(total)}</span>
      </div>
      <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Discount</span>
          <select
            className="erp-select w-36"
            value={discount.kind}
            onChange={(event) => {
              const kind = event.target.value as BillDiscount["kind"];
              onDiscountChange({ ...discount, kind });
            }}
            aria-label="Discount type"
          >
            <option value="none">No discount</option>
            <option value="percent">Percent</option>
            <option value="amount">Amount</option>
          </select>
        </div>
        {discount.kind === "percent" ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Discount %</span>
            <select
              className="erp-select w-36"
              value={String(discount.percent)}
              onChange={(event) => onDiscountChange({ ...discount, percent: Number(event.target.value) })}
              aria-label="Discount percent"
            >
              {BILL_DISCOUNT_PERCENTS.map((percent) => (
                <option key={percent} value={percent}>
                  {percent}%
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {discount.kind === "amount" ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Discount Rs</span>
            <input
              className="erp-input w-36 text-right"
              inputMode="decimal"
              aria-label="Discount amount"
              value={discount.amount || ""}
              onChange={(event) => {
                const raw = event.target.value.replace(/,/g, "");
                if (raw !== "" && !/^\d*[.]?\d*$/.test(raw)) return;
                onDiscountChange({ ...discount, amount: raw === "" || raw === "." ? 0 : Number(raw) });
              }}
            />
          </div>
        ) : null}
        {billed.discountAmount > 0 ? (
          <div className="flex justify-between text-slate-600">
            <span>Less discount</span>
            <span className="tabular-nums">- {formatInr(billed.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-semibold text-slate-900">
          <span>Net payable</span>
          <span className="tabular-nums">{formatInr(billed.netTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export function numberToWordsInr(amount: number): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
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

export function printCommercialDocument(input: {
  title: string;
  number: string;
  date?: string;
  dueDate?: string;
  party: string;
  partyGstin?: string;
  partyAddress?: string;
  partyState?: string;
  companyName?: string;
  companyGstin?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyPan?: string;
  placeOfSupply?: string;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  lines: Array<{
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountAmount?: number;
  }>;
  subTotal: number;
  taxAmount: number;
  total: number;
  discountAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  currency?: string;
  currencySymbol?: string;
  bankDetails?: {
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
    iban?: string;
    swift?: string;
  };
}) {
  const isGlobal = Boolean(input.currency && input.currency.toUpperCase() !== "INR");
  const sym = input.currencySymbol || (input.currency === "USD" ? "$" : input.currency === "EUR" ? "€" : input.currency === "GBP" ? "£" : input.currency === "AED" ? "AED " : "₹");
  const isInterState = Boolean(input.igst && input.igst > 0);
  const companyName = input.companyName || "UAB INDIA ENTERPRISES PRIVATE LIMITED";
  const companyGstin = input.companyGstin || (isGlobal ? "TRN-100234892300003" : "07AABCU9603R1ZM");
  const companyAddress = input.companyAddress || "Plot 42, Tech Horizon Park, Electronic City, Bengaluru, Karnataka - 560100";
  const placeOfSupply = input.placeOfSupply || (isGlobal ? "International Export (Zero-Rated / Standard VAT)" : "29-Karnataka");
  const amountInWords = numberToWordsInr(input.total);

  // Rows
  const tableRows = input.lines.map((line, idx) => {
    const qty = Number(line.quantity || 1);
    const rate = Number(line.unitPrice || 0);
    const disc = Number(line.discountAmount || 0);
    const taxable = qty * rate - disc;
    const taxRate = Number(line.taxRate || 18);
    const taxVal = (taxable * taxRate) / 100;
    const lineTotal = taxable + taxVal;

    return `<tr>
      <td style="text-align:center; font-size:11px; padding:6px 4px; border:1px solid #cbd5e1;">${idx + 1}</td>
      <td style="font-size:11px; padding:6px 6px; border:1px solid #cbd5e1; font-weight:600;">
        ${escapeHtml(line.description || "Goods / Services")}
      </td>
      <td style="text-align:center; font-size:11px; padding:6px 4px; border:1px solid #cbd5e1; font-family:monospace;">
        ${escapeHtml(line.hsnCode || (isGlobal ? "SAC-9983" : "998313"))}
      </td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${qty} NOS</td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${sym}${rate.toFixed(2)}</td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${sym}${disc > 0 ? disc.toFixed(2) : "0.00"}</td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1; font-weight:600;">${sym}${taxable.toFixed(2)}</td>
      ${
        isGlobal
          ? `<td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${taxRate}% (${sym}${taxVal.toFixed(2)})</td>`
          : isInterState
          ? `<td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${taxRate}% (${sym}${taxVal.toFixed(2)})</td>`
          : `<td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${(taxRate / 2)}% (${sym}${(taxVal / 2).toFixed(2)})</td>
             <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${(taxRate / 2)}% (${sym}${(taxVal / 2).toFixed(2)})</td>`
      }
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1; font-weight:700; background:#f8fafc;">${sym}${lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const cgstVal = input.cgst ?? (isInterState ? 0 : input.taxAmount / 2);
  const sgstVal = input.sgst ?? (isInterState ? 0 : input.taxAmount / 2);
  const igstVal = input.igst ?? (isInterState ? input.taxAmount : 0);

  // Simulated authenticated QR representation
  const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="90" height="90" style="border:1px solid #cbd5e1; padding:4px; background:#fff;">
    <rect width="100" height="100" fill="#fff"/>
    <rect x="5" y="5" width="30" height="30" fill="#0f172a"/>
    <rect x="10" y="10" width="20" height="20" fill="#fff"/>
    <rect x="15" y="15" width="10" height="10" fill="#0f172a"/>
    <rect x="65" y="5" width="30" height="30" fill="#0f172a"/>
    <rect x="70" y="10" width="20" height="20" fill="#fff"/>
    <rect x="75" y="15" width="10" height="10" fill="#0f172a"/>
    <rect x="5" y="65" width="30" height="30" fill="#0f172a"/>
    <rect x="10" y="70" width="20" height="20" fill="#fff"/>
    <rect x="15" y="75" width="10" height="10" fill="#0f172a"/>
    <rect x="45" y="10" width="10" height="15" fill="#0f172a"/>
    <rect x="40" y="35" width="20" height="10" fill="#0f172a"/>
    <rect x="10" y="45" width="15" height="10" fill="#0f172a"/>
    <rect x="65" y="45" width="25" height="10" fill="#0f172a"/>
    <rect x="45" y="60" width="15" height="25" fill="#0f172a"/>
    <rect x="70" y="70" width="20" height="20" fill="#0f172a"/>
  </svg>`;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=920,height=1050");
  if (!popup) return;

  popup.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(input.title)} - ${escapeHtml(input.number)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; background: #fff; line-height: 1.35; }
    .doc-container { max-width: 800px; margin: 0 auto; border: 1.5px solid #334155; padding: 14px; border-radius: 4px; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .header-table td { vertical-align: top; }
    .badge { display: inline-block; background: #1e293b; color: #fff; font-weight: 700; font-size: 13px; padding: 4px 12px; border-radius: 3px; letter-spacing: 0.5px; }
    .section-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; background: #f1f5f9; padding: 4px 6px; border: 1px solid #cbd5e1; margin-bottom: 0; color: #334155; }
    .grid-2 { display: flex; gap: 8px; margin-bottom: 8px; }
    .card-box { flex: 1; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10.5px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 8px; }
    table.data-table th { background: #0f172a; color: #fff; font-size: 10px; font-weight: 600; padding: 6px 4px; border: 1px solid #0f172a; text-transform: uppercase; }
    .totals-wrapper { display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; }
    .bank-box { flex: 1.2; border: 1px solid #cbd5e1; padding: 8px; font-size: 10.5px; background: #fafafa; }
    .calc-box { flex: 1; border: 1px solid #cbd5e1; font-size: 11px; }
    .calc-row { display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px dashed #e2e8f0; }
    .calc-row.final { background: #0f172a; color: #fff; font-weight: 700; font-size: 12px; border-bottom: none; }
    .words-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; margin-top: 6px; font-size: 10.5px; font-weight: 600; color: #1e293b; }
    .footer-sign { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 10px; border-top: 1px solid #cbd5e1; }
    .irn-box { border: 1px solid #94a3b8; background: #f8fafc; padding: 6px; font-family: monospace; font-size: 9.5px; word-break: break-all; margin-bottom: 8px; border-radius: 2px; }
    @media print {
      body { padding: 0; background: none; }
      .doc-container { border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <!-- Top Header -->
    <table class="header-table">
      <tr>
        <td style="width: 58%;">
          <div style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">${escapeHtml(companyName)}</div>
          <div style="color: #475569; font-size: 10px; margin-top: 2px;">${escapeHtml(companyAddress)}</div>
          <div style="margin-top: 4px; font-size: 10.5px; font-weight: 600;">
            GSTIN / UIN: <span style="font-family: monospace; color: #0f172a;">${escapeHtml(companyGstin)}</span> | State: Karnataka (29)
          </div>
          <div style="font-size: 10px; color: #64748b;">
            PAN: ${escapeHtml(input.companyPan || "AABCU9603R")} | CIN: U72200KA2024PTC184920
          </div>
        </td>
        <td style="width: 24%; text-align: center; vertical-align: middle;">
          <div class="badge">${escapeHtml(input.title.toUpperCase())}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 4px;">Original for Recipient</div>
        </td>
        <td style="width: 18%; text-align: right;">
          ${qrSvg}
          <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">NIC Signed QR</div>
        </td>
      </tr>
    </table>

    <!-- IRN Header Bar (if present or standard E-Invoice format) -->
    <div class="irn-box">
      <strong>IRN:</strong> ${escapeHtml(input.irn || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")}<br/>
      <strong>Ack No:</strong> ${escapeHtml(input.ackNo || "142410982348")} &nbsp;|&nbsp; <strong>Ack Date:</strong> ${escapeHtml(input.ackDate || input.date || "2026-08-22 14:30:00")}
    </div>

    <!-- Meta Details Row -->
    <div class="grid-2">
      <!-- Invoice Meta -->
      <div class="card-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: 600; width: 45%;">Invoice No:</td>
            <td style="font-weight: 700; font-family: monospace; color: #0f172a;">${escapeHtml(input.number)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Invoice Date:</td>
            <td>${escapeHtml(input.date || "2026-08-22")}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Payment Due Date:</td>
            <td>${escapeHtml(input.dueDate || "Immediate / 30 Days")}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Place of Supply:</td>
            <td style="font-weight: 600;">${escapeHtml(placeOfSupply)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Reverse Charge:</td>
            <td>No</td>
          </tr>
        </table>
      </div>

      <!-- Billed To Details -->
      <div class="card-box">
        <div style="font-weight: 700; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 3px;">
          Billed To (Customer / Buyer)
        </div>
        <div style="font-weight: 700; font-size: 11.5px; color: #0f172a;">${escapeHtml(input.party)}</div>
        <div style="color: #475569; font-size: 10px;">${escapeHtml(input.partyAddress || "Commercial Complex, MG Road, Bangalore, Karnataka")}</div>
        <div style="margin-top: 3px;">
          <strong>GSTIN:</strong> <span style="font-family: monospace;">${escapeHtml(input.partyGstin || "29ABCDE1234F1Z5")}</span>
        </div>
        <div style="color: #64748b; font-size: 10px;">State: ${escapeHtml(input.partyState || "Karnataka (29)")}</div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 34%; text-align: left;">Item Description</th>
          <th style="width: 10%;">HSN/SAC</th>
          <th style="width: 8%; text-align: right;">Qty</th>
          <th style="width: 10%; text-align: right;">Unit Rate</th>
          <th style="width: 8%; text-align: right;">Disc.</th>
          <th style="width: 10%; text-align: right;">Taxable</th>
          ${
            isInterState
              ? `<th style="width: 16%; text-align: right;">IGST</th>`
              : `<th style="width: 8%; text-align: right;">CGST</th><th style="width: 8%; text-align: right;">SGST</th>`
          }
          <th style="width: 10%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows || `<tr><td colspan="9" style="text-align:center; padding:12px;">No items attached.</td></tr>`}
      </tbody>
    </table>

    <!-- Amount In Words -->
    <div class="words-box">
      <strong>Total In Words:</strong> <em>${escapeHtml(amountInWords)}</em>
    </div>

    <!-- Bottom Calculations & Bank Info -->
    <div class="totals-wrapper">
      <!-- Bank Account Details -->
      <div class="bank-box">
        <div style="font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; color: #1e293b;">
          Bank &amp; Payment Details
        </div>
        <div><strong>Bank Name:</strong> ${escapeHtml(input.bankDetails?.bankName || "HDFC Bank Ltd")}</div>
        <div><strong>A/C Name:</strong> ${escapeHtml(companyName)}</div>
        <div><strong>A/C No:</strong> <span style="font-family:monospace; font-weight:700;">${escapeHtml(input.bankDetails?.accountNo || "50200084920194")}</span></div>
        <div><strong>IFSC Code:</strong> <span style="font-family:monospace; font-weight:700;">${escapeHtml(input.bankDetails?.ifscCode || "HDFC0001234")}</span></div>
        <div><strong>Branch:</strong> ${escapeHtml(input.bankDetails?.branch || "Koramangala, Bangalore")}</div>
        <div><strong>UPI ID:</strong> <span style="font-family:monospace; color:#2563eb;">${escapeHtml(input.bankDetails?.upiId || "uabindia@hdfcbank")}</span></div>
      </div>

      <!-- Financial Calculation Box -->
      <div class="calc-box">
        <div class="calc-row">
          <span>Total Taxable Value:</span>
          <span style="font-weight: 600;">${sym}${input.subTotal.toFixed(2)}</span>
        </div>
        ${
          isGlobal
            ? `<div class="calc-row"><span>VAT / Sales Tax:</span><span>${sym}${input.taxAmount.toFixed(2)}</span></div>`
            : isInterState
            ? `<div class="calc-row"><span>Integrated Tax (IGST):</span><span>${sym}${igstVal.toFixed(2)}</span></div>`
            : `<div class="calc-row"><span>Central Tax (CGST):</span><span>${sym}${cgstVal.toFixed(2)}</span></div>
               <div class="calc-row"><span>State Tax (SGST):</span><span>${sym}${sgstVal.toFixed(2)}</span></div>`
        }
        ${
          input.discountAmount && input.discountAmount > 0
            ? `<div class="calc-row" style="color:#b91c1c;"><span>Bill Discount:</span><span>- ${sym}${input.discountAmount.toFixed(2)}</span></div>`
            : ""
        }
        <div class="calc-row">
          <span>Total Tax Amount:</span>
          <span>${sym}${input.taxAmount.toFixed(2)}</span>
        </div>
        <div class="calc-row final">
          <span>NET PAYABLE AMOUNT:</span>
          <span>${sym}${input.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Terms and Signatures -->
    <div class="footer-sign">
      <div style="width: 58%; font-size: 9.5px; color: #475569;">
        <strong>Terms &amp; Conditions:</strong><br/>
        1. Goods once sold will not be taken back without authorization.<br/>
        2. Interest @ 18% p.a. will be charged for delayed payments after due date.<br/>
        3. Subject to Bengaluru jurisdiction only.<br/>
        <em>This is a computer-generated Digitally Signed GST Tax Invoice.</em>
      </div>
      <div style="width: 38%; text-align: right; font-size: 10px;">
        <div>For <strong>${escapeHtml(companyName)}</strong></div>
        <div style="height: 44px;"></div>
        <div style="border-top: 1px dashed #94a3b8; display: inline-block; min-width: 140px; text-align: center; padding-top: 3px; font-weight: 600;">
          Authorized Signatory
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);

  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function PrintButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={`${erpButtonClassName.secondary} text-xs`} onClick={onClick} title="Print">
      <Printer className="h-3.5 w-3.5" />
      Print
    </button>
  );
}

/** Shared document workflow actions for commercial registers (post / cancel). */
export function ErpDocumentStatusActions({
  canPost,
  canCancel,
  posting,
  onPost,
  onCancel,
}: {
  canPost?: boolean;
  canCancel?: boolean;
  posting?: boolean;
  onPost?: () => void;
  onCancel?: () => void;
}) {
  if (!canPost && !canCancel) return null;
  return (
    <div className="flex items-center gap-1.5">
      {canPost && onPost ? (
        <button type="button" disabled={posting} className={`${erpButtonClassName.primary} text-xs`} onClick={onPost}>
          {posting ? "Posting…" : "Post"}
        </button>
      ) : null}
      {canCancel && onCancel ? (
        <button type="button" disabled={posting} className={`${erpButtonClassName.secondary} text-xs`} onClick={onCancel}>
          Cancel doc
        </button>
      ) : null}
    </div>
  );
}
