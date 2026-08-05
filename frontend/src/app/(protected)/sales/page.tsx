"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Package, ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type SalesOrder = {
  id: string;
  soNumber?: string;
  customerName?: string;
  customerId?: string;
  soDate?: string;
  totalAmount?: number;
  status?: string;
};

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "₹0";

const MODULE_LINKS = [
  { href: ROUTES.SALES_ORDERS, label: "Sales Orders", icon: ShoppingCart, desc: "Process and track customer sales orders" },
  { href: ROUTES.CUSTOMERS, label: "Customers", icon: Users, desc: "Manage customer master data" },
  { href: ROUTES.QUOTATIONS, label: "Quotations", icon: FileText, desc: "Create customer quotes and proposals" },
  { href: ROUTES.INVOICES, label: "Invoices", icon: FileText, desc: "Generate and manage sales invoices" },
  { href: ROUTES.RETURNS, label: "Returns", icon: Package, desc: "Handle customer returns and credits" },
];

export default function SalesDashboardPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.erp.salesOrders.getAll(1, 50).catch(() => ({ data: [] }));
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setOrders(list);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load sales data.");
      setError(msg);
      notifyError(msg, "Sales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalValue = useMemo(() => orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [orders]);
  const pendingOrders = orders.filter((o) => ["Draft", "Pending", "Submitted"].includes(o.status || "")).length;
  const approvedOrders = orders.filter((o) => o.status === "Approved" || o.status === "Completed").length;

  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.soDate || "").getTime() - new Date(a.soDate || "").getTime())
    .slice(0, 5);

  return (
    <StandardPageLayout
      title="Sales"
      subtitle="Sales order pipeline, customer activity, and revenue tracking dashboard."
      eyebrow="ERP / Sales"
      icon="shopping-bag"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Orders", value: orders.length, helper: "total" },
            { label: "Approved", value: approvedOrders, tone: "positive" },
            { label: "Pending", value: pendingOrders, tone: "warning" },
            { label: "Value", value: formatCurrency(totalValue), tone: "info" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Orders", value: orders.length.toString(), icon: ShoppingBag, desc: "All sales orders", href: ROUTES.SALES_ORDERS },
          { label: "Pending", value: pendingOrders.toString(), icon: TrendingUp, desc: "Awaiting approval", href: ROUTES.SALES_ORDERS },
          { label: "Approved", value: approvedOrders.toString(), icon: ShoppingCart, desc: "Ready to fulfill", href: ROUTES.SALES_ORDERS },
          { label: "Avg Value", value: orders.length ? formatCurrency(totalValue / orders.length) : "₹0", icon: FileText, desc: "Per order", href: ROUTES.SALES_ORDERS },
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
            <h2 className="erp-panel-title">Sales Modules</h2>
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
            <h2 className="erp-panel-title">Recent Orders</h2>
            <Link href={ROUTES.SALES_ORDERS} className="text-xs font-bold text-[var(--erp-primary)] hover:underline">All</Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="py-8 text-center text-sm text-[var(--erp-muted)]">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-[var(--erp-muted)]">
                <ShoppingBag className="h-8 w-8 text-[var(--erp-muted-soft)]" />
                <p>No sales orders yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border-2 border-[var(--erp-border)] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--erp-ink)]">{order.soNumber || order.id.slice(0, 8)}</p>
                      <p className="truncate text-xs text-[var(--erp-muted)]">{order.customerName || "Walk-in"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-[var(--erp-ink)]">{formatCurrency(order.totalAmount)}</p>
                      <StatusBadge tone={order.status === "Approved" || order.status === "Completed" ? "positive" : order.status === "Pending" ? "warning" : "neutral"}>
                        {order.status || "Draft"}
                      </StatusBadge>
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
