"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton as RefreshButton, ErpTabBar as TabBar, ErpTabPanel as TabPanel } from "@/components/workspace/page-kit";
import { useErpListView as useListView } from "@/components/workspace/list-view";
import { crmApi, inventoryApi, procurementApi, salesApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";

const formatCurrency = (v?: number) => (v != null ? `Rs${v.toLocaleString("en-IN")}` : "-");

type SalesOrderRow = {
  id: string;
  orderNumber?: string;
  status?: string;
  totalAmount?: number;
  orderDate?: string;
};
type PurchaseOrderRow = {
  id: string;
  orderNumber?: string;
  status?: string;
  totalAmount?: number;
};

type TabKey = "sales" | "purchase" | "quick";

export default function BusinessOperationsReportsPage() {
  const [customers, setCustomers] = useState(0);
  const [vendors, setVendors] = useState(0);
  const [items, setItems] = useState(0);
  const [salesOrders, setSalesOrders] = useState<SalesOrderRow[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("sales");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [custRes, vendRes, itemRes, soRes, poRes] = await Promise.all([
        crmApi.customers.getAll(1, 1),
        procurementApi.vendors.getAll(1, 1),
        inventoryApi.items.getAll(1, 1),
        salesApi.salesOrders.getAll(1, 10),
        procurementApi.purchaseOrders.getAll(1, 10),
      ]);
      setCustomers(custRes.data?.total ?? 0);
      setVendors(vendRes.data?.total ?? 0);
      setItems(itemRes.data?.total ?? 0);
      setSalesOrders(Array.isArray(soRes.data?.data) ? soRes.data.data : Array.isArray(soRes.data) ? soRes.data : []);
      setPurchaseOrders(
        Array.isArray(poRes.data?.data) ? poRes.data.data : Array.isArray(poRes.data) ? poRes.data : [],
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load business operations reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSOValue = useMemo(
    () => salesOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    [salesOrders],
  );

  const salesList = useListView({
    listKey: "reports-operations-sales-orders",
    rows: salesOrders,
    loading: loading && activeTab === "sales",
    emptyMessage: "No sales orders found.",
    getRowId: (row) => row.id,
    onRefresh: () => void load(),
    columns: [
      { key: "orderNumber", label: "Order #", dataType: "string" },
      { key: "totalAmount", label: "Amount", dataType: "number" },
      { key: "status", label: "Status", dataType: "string" },
    ],
    renderRow: (order) => (
      <>
        <td className="erp-td text-slate-900">{order.orderNumber || order.id.slice(0, 8)}</td>
        <td className="erp-td font-medium text-slate-900">{formatCurrency(order.totalAmount)}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-info">{order.status || "-"}</span>
        </td>
      </>
    ),
  });

  const purchaseList = useListView({
    listKey: "reports-operations-purchase-orders",
    rows: purchaseOrders,
    loading: loading && activeTab === "purchase",
    emptyMessage: "No purchase orders found.",
    getRowId: (row) => row.id,
    onRefresh: () => void load(),
    columns: [
      { key: "orderNumber", label: "Order #", dataType: "string" },
      { key: "totalAmount", label: "Amount", dataType: "number" },
      { key: "status", label: "Status", dataType: "string" },
    ],
    renderRow: (order) => (
      <>
        <td className="erp-td text-slate-900">{order.orderNumber || order.id.slice(0, 8)}</td>
        <td className="erp-td font-medium text-slate-900">{formatCurrency(order.totalAmount)}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-warning">{order.status || "-"}</span>
        </td>
      </>
    ),
  });

  const tabItems = [
    { key: "sales", label: "Sales Orders", count: salesOrders.length },
    { key: "purchase", label: "Purchase Orders", count: purchaseOrders.length },
    { key: "quick", label: "Quick Access" },
  ];

  const activeListTools = activeTab === "sales" ? salesList.headerTools : activeTab === "purchase" ? purchaseList.headerTools : null;
  const activeFilterBar = activeTab === "sales" ? salesList.filterBar : activeTab === "purchase" ? purchaseList.filterBar : undefined;

  return (
    <StandardPageLayout
      title="Business Operations Reports"
      subtitle="Sales performance, procurement analysis, and inventory overview across all business operations."
      eyebrow="Reports / Business Operations"
      icon="bar-chart"
      meta={
        <HeaderSummary
          items={[
            { label: "Customers", value: customers, tone: "info" },
            { label: "Vendors", value: vendors, tone: "info" },
            { label: "Items", value: items },
            { label: "SO Value", value: formatCurrency(totalSOValue), tone: "success" },
          ]}
        />
      }
      actions={
        <>
          <RefreshButton onClick={() => void load()} loading={loading} />
          {activeListTools}
        </>
      }
      filters={activeFilterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <TabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      <TabPanel hidden={activeTab !== "sales"}>
        <CrudCard
          actions={
            <Link href={ROUTES.SALES_ORDERS} className="erp-action-btn erp-action-btn-secondary px-3 text-xs">
              View All
            </Link>
          }
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="erp-panel-title">Recent Sales Orders</h2>
            <p className="mt-1 text-sm text-slate-500">Latest 10 sales orders</p>
          </div>
          {salesList.table}
        </CrudCard>
      </TabPanel>

      <TabPanel hidden={activeTab !== "purchase"}>
        <CrudCard
          actions={
            <Link href={ROUTES.PURCHASE_ORDERS} className="erp-action-btn erp-action-btn-secondary px-3 text-xs">
              View All
            </Link>
          }
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="erp-panel-title">Recent Purchase Orders</h2>
            <p className="mt-1 text-sm text-slate-500">Latest 10 purchase orders</p>
          </div>
          {purchaseList.table}
        </CrudCard>
      </TabPanel>

      <TabPanel hidden={activeTab !== "quick"}>
        <CrudCard>
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="erp-panel-title">Quick Access</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Customers", href: ROUTES.CUSTOMERS },
              { label: "Vendors", href: ROUTES.VENDORS },
              { label: "Items", href: ROUTES.ITEMS },
              { label: "Warehouses", href: ROUTES.WAREHOUSES },
              { label: "Stock Movements", href: ROUTES.STOCK_MOVEMENTS },
              { label: "Payments", href: ROUTES.PAYMENTS },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </CrudCard>
      </TabPanel>
    </StandardPageLayout>
  );
}
