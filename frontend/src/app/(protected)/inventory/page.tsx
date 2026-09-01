"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Box, ClipboardList, Package, RotateCcw, Warehouse, TrendingUp } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { StatusBadge } from "@/components/workspace/status-badge";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpStatCardClassName,
  erpStatCardHelperClassName,
  erpStatCardLabelClassName,
  erpStatCardValueClassName,
} from "@/components/workspace/styles";
import { EmptyState } from "@/components/workspace/empty-state";
import { ROUTES } from "@/constants/routes";
import { inventoryApi } from "@/services/modules";
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

type WarehouseRow = {
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
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsRes, whRes, movRes] = await Promise.all([
        inventoryApi.items.getAll(1, 100).catch(() => ({ data: { data: [] } })),
        inventoryApi.warehouses.list(1, 50).catch(() => ({ data: { data: [] } })),
        inventoryApi.stockMovements.list(1, 20).catch(() => ({ data: [] })),
      ]);

      setItems(Array.isArray(itemsRes.data?.data) ? itemsRes.data.data : []);
      setWarehouses(Array.isArray(whRes.data?.data) ? whRes.data.data : []);
      setMovements(
        Array.isArray(movRes.data)
          ? movRes.data
          : Array.isArray(movRes.data?.data)
            ? movRes.data.data
            : []
      );
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load inventory data.");
      setError(message);
      notifyError(message, "Inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => new Set(items.map((i) => i.category).filter(Boolean)).size, [items]);
  const recentMovements = movements.slice(0, 5);
  const stockInCount = movements.filter((m) => (m.quantity || 0) > 0).length;

  return (
    <StandardPageLayout
      title="Inventory Control"
      subtitle="Item catalog, warehouse control, stock movements, and inventory valuation overview."
      eyebrow="ERP / Inventory"
      icon="box"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Items", value: items.length, helper: "catalog" },
            { label: "Categories", value: categories, tone: "info" },
            { label: "Warehouses", value: warehouses.length, tone: "warning" },
            { label: "Movements", value: movements.length, tone: "positive" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Items", value: items.length.toString(), icon: Box, desc: "SKU catalog", href: ROUTES.ITEMS },
          { label: "Warehouses", value: warehouses.length.toString(), icon: Warehouse, desc: "Storage locations", href: ROUTES.WAREHOUSES },
          { label: "Stock In", value: stockInCount.toString(), icon: TrendingUp, desc: "Receipts", href: ROUTES.STOCK_MOVEMENTS },
          {
            label: "Avg Price",
            value: items.length ? formatCurrency(items.reduce((s, i) => s + (i.sellingPrice || 0), 0) / items.length) : "₹0",
            icon: Package,
            desc: "Per item",
            href: ROUTES.ITEMS,
          },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className={`${erpStatCardClassName} block transition hover:border-slate-300`}>
            <div className="flex items-center justify-between">
              <p className={erpStatCardLabelClassName}>{kpi.label}</p>
              <kpi.icon className="h-5 w-5 text-slate-500" />
            </div>
            <p className={erpStatCardValueClassName}>{kpi.value}</p>
            <p className={erpStatCardHelperClassName}>{kpi.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Inventory Modules</h2>
            <StatusBadge tone="info">{MODULE_LINKS.length} areas</StatusBadge>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODULE_LINKS.map((module) => (
                <Link key={module.href} href={module.href} className={`group ${erpActionCardClassName} flex items-start gap-3`}>
                  <span className={erpActionCardIconClassName}>
                    <module.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`${erpActionCardTitleClassName} group-hover:text-slate-700`}>{module.label}</p>
                    <p className={erpActionCardSubtitleClassName}>{module.desc}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-slate-700" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Recent Movements</h2>
            <Link href={ROUTES.STOCK_MOVEMENTS} className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline">
              View all
            </Link>
          </div>
          <div className={erpPanelBodyClassName}>
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
            ) : recentMovements.length === 0 ? (
              <EmptyState
                title="No stock movements yet"
                description="Post your first inward, outward, or adjustment entry from Stock Movements."
                ctaLabel="Open Stock Movements"
                ctaHref={ROUTES.STOCK_MOVEMENTS}
              />
            ) : (
              <div className="space-y-2">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{m.itemName || m.movementType || "Movement"}</p>
                      <p className="truncate text-xs text-slate-500">{m.warehouseName || "—"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`font-semibold ${(m.quantity || 0) > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {(m.quantity || 0) > 0 ? "+" : ""}
                        {m.quantity || 0}
                      </span>
                      <p className="text-xs text-slate-500">{m.movementType}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
