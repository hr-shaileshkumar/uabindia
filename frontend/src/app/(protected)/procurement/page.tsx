"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Briefcase, ClipboardList, FileText, ShoppingCart, Truck, Users } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { EmptyState } from "@/components/erp/empty-state";
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
} from "@/components/erp/erpStyles";
import { ROUTES } from "@/constants/routes";
import { procurementApi } from "@/services/modules";
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
  { href: ROUTES.VENDOR_BILLS, label: "Vendor Bills", icon: FileText, desc: "Supplier invoices and payables" },
];

const poStatusTone = (status?: string) => {
  if (status === "Received" || status === "Approved") return "positive" as const;
  if (status === "Submitted" || status === "Partial") return "warning" as const;
  return "neutral" as const;
};

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
        procurementApi.vendors.getAll().catch(() => ({ data: { data: [] } })),
        procurementApi.purchaseOrders.getAll().catch(() => ({ data: { data: [] } })),
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

  useEffect(() => {
    void load();
  }, [load]);

  const totalPoValue = useMemo(() => orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [orders]);
  const pendingPOs = orders.filter((o) => ["Draft", "Submitted", "Pending"].includes(o.status || "")).length;
  const recentPOs = orders
    .slice()
    .sort((a, b) => new Date(b.poDate || "").getTime() - new Date(a.poDate || "").getTime())
    .slice(0, 5);

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
          {
            label: "Avg/PO",
            value: orders.length ? formatCurrency(totalPoValue / orders.length) : "₹0",
            icon: Briefcase,
            desc: "Per purchase order",
            href: ROUTES.PURCHASE_ORDERS,
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
            <h2 className={erpPanelTitleClassName}>Procurement Modules</h2>
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
            <h2 className={erpPanelTitleClassName}>Recent POs</h2>
            <Link href={ROUTES.PURCHASE_ORDERS} className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline">
              All
            </Link>
          </div>
          <div className={erpPanelBodyClassName}>
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
            ) : recentPOs.length === 0 ? (
              <EmptyState
                title="No purchase orders yet"
                description="Create a purchase order or convert an approved request to get started."
                ctaLabel="Open Purchase Orders"
                ctaHref={ROUTES.PURCHASE_ORDERS}
              />
            ) : (
              <div className="space-y-2">
                {recentPOs.map((po) => (
                  <div key={po.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{po.poNumber || po.id.slice(0, 8)}</p>
                      <p className="truncate text-xs text-slate-500">{po.vendorName || po.vendorId || "Vendor"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(po.totalAmount)}</p>
                      <StatusBadge tone={poStatusTone(po.status)}>{po.status || "Draft"}</StatusBadge>
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
