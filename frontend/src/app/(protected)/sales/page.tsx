"use client";

import {
  ShoppingCart,
  Receipt,
  Users,
  FileText,
  Percent,
  Package,
  RotateCcw,
  TrendingUp,
  IndianRupee,
  BarChart2,
} from "lucide-react";
import { ErpModuleDashboard } from "@/components/dynamic/ErpModuleDashboard";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: ROUTES.SALES_ORDERS, label: "Sales Orders", icon: ShoppingCart, desc: "Confirmed demand and fulfilment" },
  { href: "/invoices", label: "Sales Invoices", icon: Receipt, desc: "Tax invoices, GST e-invoices, payments" },
  { href: ROUTES.QUOTATIONS, label: "Quotations", icon: FileText, desc: "Proposals and pricing" },
  { href: ROUTES.CUSTOMERS, label: "Customer Directory", icon: Users, desc: "Account master and credit terms" },
  { href: "/sales/pricing", label: "Price Lists", icon: IndianRupee, desc: "Customer-wise pricing and rate cards" },
  { href: "/sales/discounts", label: "Discounts", icon: Percent, desc: "Promotional and contract discounts" },
  { href: "/sales/returns", label: "Sales Returns", icon: RotateCcw, desc: "Credit notes and return orders" },
];

export default function SalesPage() {
  return (
    <ErpModuleDashboard
      moduleKey="sales"
      title="Sales & Revenue"
      subtitle="Orders, invoices, customers, quotations, and revenue performance across all channels."
      eyebrow="Sales"
      icon={TrendingUp}
      color="from-orange-500 via-amber-500 to-yellow-500"
      statsEndpoint="/sales/dashboard/stats"
      statsMapper={(data) => [
        { label: "Gross Sales (MTD)", value: data?.grossSalesMTD ? `₹${Number(data.grossSalesMTD).toLocaleString("en-IN")}` : "—", icon: TrendingUp, tone: "positive", trend: data?.salesTrend },
        { label: "Open Orders", value: data?.openOrders ?? 0, icon: ShoppingCart, tone: "info" },
        { label: "Pending Invoices", value: data?.pendingInvoices ?? 0, icon: Receipt, tone: "warning" },
        { label: "Revenue YTD", value: data?.revenueYTD ? `₹${Number(data.revenueYTD).toLocaleString("en-IN")}` : "—", icon: BarChart2, tone: "positive" },
      ]}
      kpis={[
        { label: "Gross Sales (MTD)", value: "—", icon: TrendingUp, tone: "positive" },
        { label: "Open Orders", value: "—", icon: ShoppingCart, tone: "info" },
        { label: "Pending Invoices", value: "—", icon: Receipt, tone: "warning" },
        { label: "Revenue YTD", value: "—", icon: BarChart2, tone: "positive" },
      ]}
      links={LINKS}
      linksTitle="Sales Workspaces"
      activityEndpoint="/sales/activity"
    />
  );
}
