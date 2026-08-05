"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Box, ClipboardList, Package, RotateCcw, Warehouse, TrendingUp } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type Item = {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  sellingPrice: number;
  purchasePrice?: number;
  hsnCode?: string;
};

type Warehouse = {
  id: string;
  warehouseName: string;
  location?: string;
};

type Movement = {
  id: string;
  itemId?: string;
  itemName?: string;
  warehouseId?: string;
  warehouseName?: string;
  movementType?: string;
  quantity?: number;
  movementDate?: string;
};

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "₹0";

const MODULE_LINKS = [
  { href: ROUTES.ITEMS, label: "Items", icon: Box, desc: "Manage item master catalog and pricing" },
  { href: ROUTES.WAREHOUSES, label: "Warehouses", icon: Warehouse, desc: "Manage warehouse locations" },
  { href: ROUTES.STOCK_MOVEMENTS, label: "Stock Movements", icon: ClipboardList, desc: "Track stock receipts, issues, and adjustments" },
  { href: ROUTES.INVENTORY_ADJUSTMENTS, label: "Adjustments", icon: RotateCcw, desc: "Record stock corrections and write-offs" },
  { href: ROUTES.INVENTORY_TRANSFERS, label: "Transfers", icon: TrendingUp, desc: "Move stock between warehouses" },
];

export default function InventoryDashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsRes, whRes, movRes] = await Promise.all([
        hrApi.erp.items.getAll(1, 100).catch(() => ({ data: { data: [] } })),
        hrApi.erp.warehouses.list(1, 50).catch(() => ({ data: { data: [] } })),
        hrApi.erp.stockMovements.list(1, 20).catch(() => ({ data: [] })),
      ]);

      setItems(Array.isArray(itemsRes.data?.data) ? itemsRes.data.data : []);
      setWarehouses(Array.isArray(whRes.data?.data) ? whRes.data.data : []);
      setMovements(Array.isArray(movRes.data) ? movRes.data : Array.isArray(movRes.data?.data) ? movRes.data.data : []);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load inventory data.");
      setError(message);
      notifyError(message, "Inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const categories = useMemo(() => new Set(items.map((i) => i.category).filter(Boolean)).size, [items]);
  const recentMovements = movements.slice(0, 5);
  const stockInCount = movements.filter((m) => (m.quantity || 0) > 0).length;

  return (
    <div className="erp-page space-y-5">
      <PageHeader
        title="Inventory Control"
        subtitle="Item catalog, warehouse control, stock movements, and inventory valuation overview."
        eyebrow="ERP / Inventory"
        icon="box"
        stats={[
          { label: "Items", value: items.length },
          { label: "Categories", value: categories, tone: "info" },
          { label: "Warehouses", value: warehouses.length, tone: "warning" },
          { label: "Movements", value: movements.length, tone: "success" },
        ]}
      />
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Items", value: items.length.toString(), icon: Box, desc: "SKU catalog", href: ROUTES.ITEMS },
          { label: "Warehouses", value: warehouses.length.toString(), icon: Warehouse, desc: "Storage locations", href: ROUTES.WAREHOUSES },
          { label: "Stock In", value: stockInCount.toString(), icon: TrendingUp, desc: "Receipts", href: ROUTES.STOCK_MOVEMENTS },
          { label: "Avg Price", value: items.length ? formatCurrency(items.reduce((s, i) => s + (i.sellingPrice || 0), 0) / items.length) : "₹0", icon: Package, desc: "Per item", href: ROUTES.ITEMS },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="erp-kpi-card erp-kpi-card block transition hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <p className="erp-kpi-label">{kpi.label}</p>
              <kpi.icon className="h-5 w-5 text-teal-500" />
            </div>
            <p className="erp-kpi-value">{kpi.value}</p>
            <p className="erp-kpi-meta">{kpi.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="erp-panel">
          <div className="erp-panel-header">
            <h2 className="erp-panel-title">Inventory Modules</h2>
            <StatusBadge tone="info">{MODULE_LINKS.length} areas</StatusBadge>
          </div>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {MODULE_LINKS.map((module) => (
                <Link key={module.href} href={module.href}
                  className="group flex items-start gap-3 rounded-xl border-2 border-[var(--erp-border)] p-3.5 transition hover:border-[var(--erp-primary)] hover:bg-[var(--erp-info-bg)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--erp-primary-muted)] text-[var(--erp-primary)]">
                    <module.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--erp-ink)] group-hover:text-[var(--erp-primary)]">{module.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--erp-muted)]">{module.desc}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--erp-muted-soft)] transition group-hover:text-[var(--erp-primary)]" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="erp-panel">
          <div className="erp-panel-header">
            <h2 className="erp-panel-title">Recent Movements</h2>
            <Link href={ROUTES.STOCK_MOVEMENTS} className="text-xs font-bold text-[var(--erp-primary)] hover:underline">View all</Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--erp-muted)]">Loading...</div>
            ) : recentMovements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-[var(--erp-muted)]">
                <Package className="h-8 w-8 text-[var(--erp-muted-soft)]" />
                <p>No stock movements yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border-2 border-[var(--erp-border)] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--erp-ink)]">{m.itemName || m.movementType || "Movement"}</p>
                      <p className="truncate text-xs text-[var(--erp-muted)]">{m.warehouseName || "-"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`font-bold ${(m.quantity || 0) > 0 ? "text-[var(--erp-success)]" : "text-[var(--erp-danger)]"}`}>
                        {(m.quantity || 0) > 0 ? "+" : ""}{m.quantity || 0}
                      </span>
                      <p className="text-xs text-[var(--erp-muted)]">{m.movementType}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-panel-header">
          <h2 className="erp-panel-title">Item Catalog</h2>
          <Link href={ROUTES.ITEMS} className="text-xs font-bold text-[var(--erp-primary)] hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Code</th>
                <th className="erp-th">Name</th>
                <th className="erp-th">Category</th>
                <th className="erp-th text-right">Sell Price</th>
                <th className="erp-th text-right">Buy Price</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="erp-td py-12 text-center text-sm text-[var(--erp-muted)]">No items in catalog.</td></tr>
              ) : (
                items.slice(0, 8).map((item) => (
                  <tr key={item.id} className="erp-tr">
                    <td className="erp-td font-mono text-xs font-semibold text-[var(--erp-ink)]">{item.itemCode}</td>
                    <td className="erp-td font-semibold text-[var(--erp-ink)]">{item.itemName}</td>
                    <td className="erp-td"><span className="erp-chip erp-chip-neutral text-[10px]">{item.category || "General"}</span></td>
                    <td className="erp-td text-right font-semibold text-[var(--erp-ink)]">{formatCurrency(item.sellingPrice)}</td>
                    <td className="erp-td text-right text-[var(--erp-muted)]">{item.purchasePrice ? formatCurrency(item.purchasePrice) : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
