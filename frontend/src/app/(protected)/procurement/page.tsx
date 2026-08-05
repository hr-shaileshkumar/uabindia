"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Briefcase, ClipboardList, FileText, ShoppingCart, Truck, Users } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type Vendor = {
  id: string;
  vendorCode: string;
  vendorName: string;
  vendorType: string;
  paymentTerms?: number;
  creditLimit?: number;
};

type PurchaseOrder = {
  id: string;
  poNumber?: string;
  vendorId?: string;
  vendorName?: string;
  poDate?: string;
  totalAmount?: number;
  status?: string;
};

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "₹0";

const MODULE_LINKS = [
  { href: ROUTES.VENDORS, label: "Vendors", icon: Briefcase, desc: "Manage vendor master and supplier data" },
  { href: ROUTES.PURCHASE_REQUESTS, label: "Purchase Requests", icon: ClipboardList, desc: "Create and track purchase requests" },
  { href: ROUTES.PURCHASE_ORDERS, label: "Purchase Orders", icon: ShoppingCart, desc: "Process and manage purchase orders" },
  { href: ROUTES.GRN, label: "Goods Receipt", icon: Truck, desc: "Record goods receipt against POs" },
];

export default function ProcurementDashboardPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [venRes, poRes] = await Promise.all([
        hrApi.erp.vendors.getAll().catch(() => ({ data: { data: [] } })),
        hrApi.erp.purchaseOrders.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      setVendors(Array.isArray(venRes.data?.data) ? venRes.data.data : []);
      setOrders(Array.isArray(poRes.data?.data) ? poRes.data.data : []);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load procurement data.");
      setError(msg);
      notifyError(msg, "Procurement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalPoValue = useMemo(() => orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [orders]);
  const pendingPOs = orders.filter((o) => ["Draft", "Submitted", "Pending"].includes(o.status || "")).length;
  const recentPOs = orders.slice().sort((a, b) => new Date(b.poDate || "").getTime() - new Date(a.poDate || "").getTime()).slice(0, 5);

  return (
    <StandardPageLayout
      title="Procurement"
      subtitle="Vendor management, purchase orders, and goods receipt tracking dashboard."
      eyebrow="ERP / Procurement"
      icon="shopping-cart"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Vendors", value: vendors.length, helper: "suppliers" },
            { label: "POs", value: orders.length, helper: "purchase orders" },
            { label: "Pending", value: pendingPOs, tone: "warning" },
            { label: "Total", value: formatCurrency(totalPoValue), tone: "info" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Vendors", value: vendors.length.toString(), icon: Users, desc: "Active suppliers", href: ROUTES.VENDORS },
          { label: "POs Placed", value: orders.length.toString(), icon: ShoppingCart, desc: "Total orders", href: ROUTES.PURCHASE_ORDERS },
          { label: "Pending", value: pendingPOs.toString(), icon: FileText, desc: "Awaiting processing", href: ROUTES.PURCHASE_ORDERS },
          { label: "Avg/PO", value: orders.length ? formatCurrency(totalPoValue / orders.length) : "₹0", icon: Briefcase, desc: "Per purchase order", href: ROUTES.PURCHASE_ORDERS },
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
            <h2 className="erp-panel-title">Procurement Modules</h2>
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
            <h2 className="erp-panel-title">Recent POs</h2>
            <Link href={ROUTES.PURCHASE_ORDERS} className="text-xs font-bold text-[var(--erp-primary)] hover:underline">All</Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--erp-muted)]">Loading...</div>
            ) : recentPOs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-[var(--erp-muted)]">
                <ShoppingCart className="h-8 w-8 text-[var(--erp-muted-soft)]" />
                <p>No purchase orders yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPOs.map((po) => (
                  <div key={po.id} className="flex items-center justify-between rounded-lg border-2 border-[var(--erp-border)] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--erp-ink)]">{po.poNumber || po.id.slice(0, 8)}</p>
                      <p className="truncate text-xs text-[var(--erp-muted)]">{po.vendorName || po.vendorId || "Vendor"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-[var(--erp-ink)]">{formatCurrency(po.totalAmount)}</p>
                      <StatusBadge tone={
                        po.status === "Received" || po.status === "Approved" ? "positive" :
                        po.status === "Submitted" || po.status === "Partial" ? "warning" : "neutral"
                      }>{po.status || "Draft"}</StatusBadge>
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
          <h2 className="erp-panel-title">Vendor Directory</h2>
          <Link href={ROUTES.VENDORS} className="text-xs font-bold text-[var(--erp-primary)] hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Code</th>
                <th className="erp-th">Name</th>
                <th className="erp-th">Type</th>
                <th className="erp-th text-right">Payment Terms</th>
                <th className="erp-th text-right">Credit Limit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={5} className="erp-td py-12 text-center text-sm text-[var(--erp-muted)]">No vendors registered.</td></tr>
              ) : (
                vendors.slice(0, 8).map((vendor) => (
                  <tr key={vendor.id} className="erp-tr">
                    <td className="erp-td font-mono text-xs font-semibold text-[var(--erp-ink)]">{vendor.vendorCode}</td>
                    <td className="erp-td font-semibold text-[var(--erp-ink)]">{vendor.vendorName}</td>
                    <td className="erp-td"><span className="erp-chip erp-chip-neutral text-[10px]">{vendor.vendorType || "Supplier"}</span></td>
                    <td className="erp-td text-right text-[var(--erp-muted)]">{vendor.paymentTerms || 0}d</td>
                    <td className="erp-td text-right font-semibold text-[var(--erp-ink)]">{formatCurrency(vendor.creditLimit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
