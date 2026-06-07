"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { ROUTES } from "@/constants/routes";

const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function ErpReportsPage() {
  const [customers, setCustomers] = useState(0);
  const [vendors, setVendors] = useState(0);
  const [items, setItems] = useState(0);
  const [salesOrders, setSalesOrders] = useState<{ id: string; orderNumber?: string; status?: string; totalAmount?: number; orderDate?: string }[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<{ id: string; orderNumber?: string; status?: string; totalAmount?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [custRes, vendRes, itemRes, soRes, poRes] = await Promise.all([
          hrApi.erp.customers.getAll(1, 1),
          hrApi.erp.vendors.getAll(1, 1),
          hrApi.erp.items.getAll(1, 1),
          hrApi.erp.salesOrders.getAll(1, 10),
          hrApi.erp.purchaseOrders.getAll(1, 10),
        ]);
        setCustomers(custRes.data?.total ?? 0);
        setVendors(vendRes.data?.total ?? 0);
        setItems(itemRes.data?.total ?? 0);
        setSalesOrders(Array.isArray(soRes.data?.data) ? soRes.data.data : Array.isArray(soRes.data) ? soRes.data : []);
        setPurchaseOrders(Array.isArray(poRes.data?.data) ? poRes.data.data : Array.isArray(poRes.data) ? poRes.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load business operations reports");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totalSOValue = salesOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  return (
    <StandardPageLayout
      title="Business Operations Reports"
      subtitle="Sales performance, procurement analysis, and inventory overview across all business operations."
      eyebrow="Reports / Business Operations"
      icon="bar-chart"
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Customers</p>
          <p className="erp-kpi-value">{customers}</p>
          <p className="erp-kpi-meta">Total customer records</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Vendors</p>
          <p className="erp-kpi-value">{vendors}</p>
          <p className="erp-kpi-meta">Total vendor records</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Inventory Items</p>
          <p className="erp-kpi-value">{items}</p>
          <p className="erp-kpi-meta">Items in catalog</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Sales Order Value</p>
          <p className="erp-kpi-value erp-kpi-value-success">{formatCurrency(totalSOValue)}</p>
          <p className="erp-kpi-meta">This page total</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales Orders */}
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Recent Sales Orders</h2>
              <p className="mt-1 text-sm text-slate-500">Latest 10 sales orders</p>
            </div>
            <Link href={ROUTES.SALES_ORDERS} className="erp-action-btn erp-action-btn-secondary text-xs px-3">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Order #</th>
                  <th className="erp-th">Amount</th>
                  <th className="erp-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={3} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>)
                ) : salesOrders.length === 0 ? (
                  <tr><td colSpan={3} className="erp-td py-8 text-center text-slate-400">No sales orders found.</td></tr>
                ) : (
                  salesOrders.map((o) => (
                    <tr key={o.id} className="erp-tr">
                      <td className="erp-td text-slate-900">{o.orderNumber || o.id.slice(0, 8)}</td>
                      <td className="erp-td font-medium text-slate-900">{formatCurrency(o.totalAmount)}</td>
                      <td className="erp-td"><span className="erp-chip erp-chip-info">{o.status || "—"}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Recent Purchase Orders</h2>
              <p className="mt-1 text-sm text-slate-500">Latest 10 purchase orders</p>
            </div>
            <Link href={ROUTES.PURCHASE_ORDERS} className="erp-action-btn erp-action-btn-secondary text-xs px-3">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Order #</th>
                  <th className="erp-th">Amount</th>
                  <th className="erp-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={3} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>)
                ) : purchaseOrders.length === 0 ? (
                  <tr><td colSpan={3} className="erp-td py-8 text-center text-slate-400">No purchase orders found.</td></tr>
                ) : (
                  purchaseOrders.map((o) => (
                    <tr key={o.id} className="erp-tr">
                      <td className="erp-td text-slate-900">{o.orderNumber || o.id.slice(0, 8)}</td>
                      <td className="erp-td font-medium text-slate-900">{formatCurrency(o.totalAmount)}</td>
                      <td className="erp-td"><span className="erp-chip erp-chip-warning">{o.status || "—"}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="erp-panel">
        <div className="erp-panel-header">
          <h2 className="erp-panel-title">Quick Access</h2>
        </div>
        <div className="erp-panel-body">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Customers", href: ROUTES.CUSTOMERS },
              { label: "Vendors", href: ROUTES.VENDORS },
              { label: "Items", href: ROUTES.ITEMS },
              { label: "Warehouses", href: ROUTES.WAREHOUSES },
              { label: "Stock Movements", href: ROUTES.STOCK_MOVEMENTS },
              { label: "Payments", href: ROUTES.PAYMENTS },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
