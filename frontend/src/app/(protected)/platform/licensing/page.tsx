"use client";

import React, { useState } from "react";
import { CreditCard, Plus, Eye, Users, HardDrive, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface PlanRow {
  id: string;
  name: string;
  monthlyPrice: string;
  maxUsers: number;
  maxStorageGb: number;
  activeTenantsCount: number;
}

const SEED_PLANS: PlanRow[] = [
  { id: "plan_1", name: "Starter SaaS Plan", monthlyPrice: "₹4,999 / mo", maxUsers: 10, maxStorageGb: 50, activeTenantsCount: 4 },
  { id: "plan_2", name: "Growth Business Tier", monthlyPrice: "₹14,999 / mo", maxUsers: 50, maxStorageGb: 250, activeTenantsCount: 8 },
  { id: "plan_3", name: "Enterprise Dedicated Cluster", monthlyPrice: "₹49,999 / mo", maxUsers: 500, maxStorageGb: 2000, activeTenantsCount: 6 },
];

export default function LicensingPage() {
  const [plans] = useState<PlanRow[]>(SEED_PLANS);

  const kpis: KpiMetricItem[] = [
    { label: "Active Subscriptions", value: plans.reduce((acc, p) => acc + p.activeTenantsCount, 0), tone: "positive", icon: <CreditCard className="h-3.5 w-3.5" />, subtext: "Paid Tenants" },
    { label: "Total Seat Allocation", value: "1,420 Seats", tone: "info", icon: <Users className="h-3.5 w-3.5" />, subtext: "Capacity 200k" },
    { label: "Cloud Storage Usage", value: "480 GB", tone: "warning", icon: <HardDrive className="h-3.5 w-3.5" />, subtext: "S3 Storage" },
    { label: "Billing Cycle", value: "Monthly Auto", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Razorpay / Stripe" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Licensing, Subscription Plans & Billing Engine"
      subtitle="Configure SaaS subscription tiers, user seat limits, storage quotas, and invoice billing cycles."
      categoryTag="Subscription Billing Architecture"
      kpiMetrics={kpis}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Subscription Tier</th>
              <th className="erp-th">Monthly Rate</th>
              <th className="erp-th">Max Seats Limit</th>
              <th className="erp-th">Storage Quota</th>
              <th className="erp-th text-right">Subscribed Tenants</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                  {p.name}
                </td>
                <td className="erp-td font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.monthlyPrice}</td>
                <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{p.maxUsers} Users / Tenant</td>
                <td className="erp-td font-mono text-xs text-slate-500">{p.maxStorageGb} GB SSD</td>
                <td className="erp-td text-right">
                  <Badge variant="outline" className="font-mono text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200">
                    {p.activeTenantsCount} Tenants
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
