"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Package, Percent, ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
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
  erpStatusBadgeTone,
} from "@/components/workspace/styles";
import { ROUTES } from "@/constants/routes";
import { salesApi } from "@/services/modules";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatCurrency } from "@/lib/formatters";
import { useLocalization } from "@/context/LocalizationContext";

type SalesOrder = {
  id: string;
  soNumber?: string;
  customerName?: string;
  customerId?: string;
  soDate?: string;
  totalAmount?: number;
  status?: string;
};

const MODULE_LINKS = [
  { href: ROUTES.SALES_ORDERS, label: "Sales Orders", icon: ShoppingCart, desc: "Process and track customer orders" },
  { href: ROUTES.CUSTOMERS, label: "Customers", icon: Users, desc: "Customer master data" },
  { href: ROUTES.QUOTATIONS, label: "Quotations", icon: FileText, desc: "Quotes and proposals" },
  { href: ROUTES.DISCOUNTS, label: "Discounts", icon: Percent, desc: "Product and category discount schemes" },
  { href: ROUTES.INVOICES, label: "Invoices", icon: FileText, desc: "Sales invoices and billing" },
  { href: ROUTES.RETURNS, label: "Returns", icon: Package, desc: "Customer returns and credits" },
];

export default function SalesDashboardPage() {
  const { activeCountry } = useLocalization();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salesApi.salesOrders.getAll(1, 50).catch(() => ({ data: [] }));
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

  useEffect(() => {
    void load();
  }, [load]);

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
      subtitle="Sales order pipeline and module navigation."
      eyebrow="ERP / Sales"
      icon="shopping-bag"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Orders", value: loading ? "…" : orders.length, helper: "total" },
            { label: "Pending", value: loading ? "…" : pendingOrders, tone: pendingOrders > 0 ? "warning" : "positive" },
            { label: "Approved", value: loading ? "…" : approvedOrders, tone: "positive" },
            { label: "Avg Value", value: loading ? "…" : (orders.length ? formatCurrency(totalValue / orders.length, activeCountry.currency) : formatCurrency(0, activeCountry.currency)), tone: "info" },
          ]}
        />
      }
    >
      {error ? (
        <div className="erp-alert-error">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total orders", value: orders.length.toString(), icon: ShoppingBag, desc: "All sales orders", href: ROUTES.SALES_ORDERS },
          { label: "Pending", value: pendingOrders.toString(), icon: TrendingUp, desc: "Awaiting approval", href: ROUTES.SALES_ORDERS },
          { label: "Approved", value: approvedOrders.toString(), icon: ShoppingCart, desc: "Ready to fulfill", href: ROUTES.SALES_ORDERS },
          {
            label: "Avg value",
            value: orders.length ? formatCurrency(totalValue / orders.length, activeCountry.currency) : formatCurrency(0, activeCountry.currency),
            icon: FileText,
            desc: "Per order",
            href: ROUTES.SALES_ORDERS,
          },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className={`${erpStatCardClassName} block transition hover:border-slate-300`}>
            <div className="flex items-center justify-between">
              <p className={erpStatCardLabelClassName}>{kpi.label}</p>
              <kpi.icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className={erpStatCardValueClassName}>{loading ? "…" : kpi.value}</p>
            <p className={erpStatCardHelperClassName}>{kpi.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Sales modules</h2>
            <span className={erpStatusBadgeTone.info}>{MODULE_LINKS.length} areas</span>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODULE_LINKS.map((module) => (
                <Link key={module.href} href={module.href} className={`${erpActionCardClassName} group flex items-start gap-3`}>
                  <span className={erpActionCardIconClassName}>
                    <module.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={erpActionCardTitleClassName}>{module.label}</p>
                    <p className={erpActionCardSubtitleClassName}>{module.desc}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-slate-700" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Recent orders</h2>
            <Link href={ROUTES.SALES_ORDERS} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              View all
            </Link>
          </div>
          <div className={erpPanelBodyClassName}>
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500">
                <ShoppingBag className="h-8 w-8 text-slate-300" />
                <p>No sales orders yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {order.soNumber || order.id.slice(0, 8)}
                      </p>
                      <p className="truncate text-xs text-slate-500">{order.customerName || "Walk-in"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(order.totalAmount, activeCountry.currency)}</p>
                      <span className={erpStatusBadgeTone.neutral}>{order.status || "Draft"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </StandardPageLayout>
  );
}
