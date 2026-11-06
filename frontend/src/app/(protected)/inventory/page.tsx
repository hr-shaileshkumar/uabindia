"use client";

import {
  Package,
  Warehouse,
  ArrowRightLeft,
  ClipboardEdit,
  BarChart2,
  Truck,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";

const LINKS = [
  { href: "/inventory/items", label: "Item Master", icon: Package, desc: "SKUs, categories, and pricing" },
  { href: "/inventory/warehouses", label: "Warehouse Setup", icon: Warehouse, desc: "Storage locations and zones" },
  { href: "/inventory/warehouse-management", label: "WMS", icon: Warehouse, desc: "Bin-level stock management" },
  { href: "/inventory-transfers", label: "Stock Transfers", icon: ArrowRightLeft, desc: "Inter-warehouse movements" },
  { href: "/inventory-adjustments", label: "Stock Adjustments", icon: ClipboardEdit, desc: "Quantity corrections and write-offs" },
  { href: "/stock-movements", label: "Stock Movements", icon: Truck, desc: "Full inward/outward ledger" },
];

export default function InventoryPage() {
  return (
    <UabModuleDashboard
      moduleKey="inventory"
      title="Inventory & Warehouse"
      subtitle="Item master, warehouse management, stock transfers, adjustments, and movement ledger."
      eyebrow="Inventory"
      icon={Package}
      color="from-slate-600 via-zinc-600 to-stone-600"
      statsEndpoint="/inventory/dashboard/stats"
      statsMapper={(data) => [
        { label: "Total SKUs", value: data?.totalItems ?? 0, icon: Package, tone: "neutral" },
        { label: "Low Stock Alerts", value: data?.lowStockCount ?? 0, icon: AlertTriangle, tone: "warning" },
        { label: "Warehouses", value: data?.warehouseCount ?? 0, icon: Warehouse, tone: "info" },
        { label: "Stock Value", value: data?.stockValue ? `₹${Number(data.stockValue).toLocaleString("en-IN")}` : "—", icon: BarChart2, tone: "positive" },
      ]}
      kpis={[
        { label: "Total SKUs", value: "—", icon: Package, tone: "neutral" },
        { label: "Low Stock Alerts", value: "—", icon: AlertTriangle, tone: "warning" },
        { label: "Warehouses", value: "—", icon: Warehouse, tone: "info" },
        { label: "Stock Value", value: "—", icon: BarChart2, tone: "positive" },
      ]}
      links={LINKS}
      linksTitle="Inventory Workspaces"
    />
  );
}
