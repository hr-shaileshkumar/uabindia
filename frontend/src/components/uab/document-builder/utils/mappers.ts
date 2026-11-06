import type { MasterOption } from "../types";
import { asRows } from "./calculations";

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
