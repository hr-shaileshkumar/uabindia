"use client";

import {
  Cpu,
  Layers,
  ClipboardList,
  Wrench,
  Package,
  BarChart2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";

const LINKS = [
  { href: "/manufacturing/work-orders", label: "Work Orders", icon: Cpu, desc: "Production job cards and BOM execution" },
  { href: "/manufacturing/bom", label: "Bill of Materials", icon: Layers, desc: "Product structure and components" },
  { href: "/manufacturing/production-plans", label: "Production Plans", icon: ClipboardList, desc: "Demand-based planning" },
  { href: "/manufacturing/machines", label: "Machine Master", icon: Wrench, desc: "Equipment, capacity, and maintenance" },
  { href: "/inventory/items", label: "Finished Goods", icon: Package, desc: "FG inventory levels" },
];

export default function ManufacturingPage() {
  return (
    <UabModuleDashboard
      moduleKey="manufacturing"
      title="Manufacturing & Production"
      subtitle="Work orders, bill of materials, production planning, and shop floor execution."
      eyebrow="Manufacturing"
      icon={Cpu}
      color="from-rose-600 via-red-600 to-orange-600"
      statsEndpoint="/manufacturing/dashboard/stats"
      statsMapper={(data) => [
        { label: "Open Work Orders", value: data?.openWOs ?? 0, icon: Cpu, tone: "info" },
        { label: "In Production", value: data?.inProgress ?? 0, icon: Clock, tone: "warning" },
        { label: "Completed (MTD)", value: data?.completedMTD ?? 0, icon: CheckCircle2, tone: "positive" },
        { label: "Efficiency", value: data?.efficiency ? `${data.efficiency}%` : "—", icon: BarChart2, tone: "neutral" },
      ]}
      kpis={[
        { label: "Open Work Orders", value: "—", icon: Cpu, tone: "info" },
        { label: "In Production", value: "—", icon: Clock, tone: "warning" },
        { label: "Completed (MTD)", value: "—", icon: CheckCircle2, tone: "positive" },
        { label: "Efficiency", value: "—", icon: BarChart2, tone: "neutral" },
      ]}
      links={LINKS}
      linksTitle="Manufacturing Workspaces"
    >
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <a
          href="/manufacturing/work-orders"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Cpu className="w-3.5 h-3.5" />
          Production Work Orders
        </a>
        <a
          href="/manufacturing/bom"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
        >
          <Layers className="w-3.5 h-3.5" />
          Bill of Materials (BOM) Studio
        </a>
      </div>
    </UabModuleDashboard>
  );
}
