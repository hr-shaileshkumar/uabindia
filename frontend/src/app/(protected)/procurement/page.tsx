"use client";

import {
  ShoppingBag,
  ClipboardList,
  Truck,
  Building2,
  FileText,
  PackageCheck,
  ReceiptText,
  TrendingDown,
  Clock,
} from "lucide-react";
import { ErpModuleDashboard } from "@/components/dynamic/ErpModuleDashboard";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: "/procurement/purchase-requests", label: "Purchase Requests", icon: ClipboardList, desc: "Internal material requisitions" },
  { href: "/procurement/purchase-orders", label: "Purchase Orders", icon: ShoppingBag, desc: "Vendor POs and supply contracts" },
  { href: "/procurement/goods-receipt-notes", label: "Goods Receipt Notes", icon: PackageCheck, desc: "Inward delivery and quality check" },
  { href: "/vendor-bills", label: "Vendor Bills", icon: ReceiptText, desc: "AP invoices and payment schedules" },
  { href: "/procurement/vendors", label: "Vendor Directory", icon: Building2, desc: "Supplier master and ratings" },
  { href: "/payments", label: "Payments", icon: FileText, desc: "Payment runs and bank transfers" },
];

export default function ProcurementPage() {
  return (
    <ErpModuleDashboard
      moduleKey="procurement"
      title="Procurement & Payables"
      subtitle="Purchase requests, vendor orders, goods receipts, bills, and supplier management."
      eyebrow="Procurement"
      icon={ShoppingBag}
      color="from-cyan-600 via-sky-600 to-blue-600"
      statsEndpoint="/procurement/dashboard/stats"
      statsMapper={(data) => [
        { label: "Open PRs", value: data?.openPRs ?? 0, icon: ClipboardList, tone: "info" },
        { label: "Open POs", value: data?.openPOs ?? 0, icon: ShoppingBag, tone: "warning" },
        { label: "Pending GRNs", value: data?.pendingGRNs ?? 0, icon: Truck, tone: "neutral" },
        { label: "AP Outstanding", value: data?.apOutstanding ? `₹${Number(data.apOutstanding).toLocaleString("en-IN")}` : "—", icon: TrendingDown, tone: "negative" },
      ]}
      kpis={[
        { label: "Open PRs", value: "—", icon: ClipboardList, tone: "info" },
        { label: "Open POs", value: "—", icon: ShoppingBag, tone: "warning" },
        { label: "Pending GRNs", value: "—", icon: Truck, tone: "neutral" },
        { label: "AP Outstanding", value: "—", icon: TrendingDown, tone: "negative" },
      ]}
      links={LINKS}
      linksTitle="Procurement Workspaces"
    />
  );
}
