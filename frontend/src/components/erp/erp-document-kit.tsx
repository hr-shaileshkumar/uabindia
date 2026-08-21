"use client";

import { useEffect, useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import { erpButtonClassName } from "@/components/erp/erpStyles";
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

export function printCommercialDocument(input: {
  title: string;
  number: string;
  date?: string;
  party: string;
  placeOfSupply?: string;
  lines: Array<{ description: string; quantity: number; unitPrice: number; taxRate: number }>;
  subTotal: number;
  taxAmount: number;
  total: number;
  discountAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}) {
  const rows = input.lines
    .map((line) => {
      const amounts = lineAmounts({
        ...emptyDocLine(),
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
      });
      return `<tr>
        <td>${escapeHtml(line.description || "-")}</td>
        <td style="text-align:right">${line.quantity}</td>
        <td style="text-align:right">${line.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">${line.taxRate}%</td>
        <td style="text-align:right">${amounts.total.toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  const gstRows = input.igst
    ? `<div>IGST: ${formatInr(input.igst)}</div>`
    : `<div>CGST: ${formatInr(input.cgst ?? input.taxAmount / 2)}</div><div>SGST: ${formatInr(input.sgst ?? input.taxAmount / 2)}</div>`;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(input.title)} ${escapeHtml(input.number)}</title>
    <style>
      body { font-family: Segoe UI, sans-serif; color: #0f172a; padding: 32px; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 13px; }
      th { background: #f8fafc; text-align: left; }
      .meta { color: #475569; font-size: 13px; }
      .totals { margin-top: 16px; text-align: right; font-size: 13px; }
    </style></head><body>
      <h1>${escapeHtml(input.title)}</h1>
      <div class="meta">${escapeHtml(input.number)} · ${escapeHtml(input.date || "")}</div>
      <div class="meta">Party: ${escapeHtml(input.party)}</div>
      ${input.placeOfSupply ? `<div class="meta">Place of supply: ${escapeHtml(input.placeOfSupply)}</div>` : ""}
      <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5">No lines</td></tr>`}</tbody></table>
      <div class="totals">
        <div>Taxable: ${formatInr(input.subTotal)}</div>
        ${gstRows}
        <div>Total: ${formatInr(input.total + (input.discountAmount ?? 0))}</div>
        ${input.discountAmount ? `<div>Discount: - ${formatInr(input.discountAmount)}</div>` : ""}
        <div><strong>Net payable: ${formatInr(input.total)}</strong></div>
      </div>
    </body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
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
