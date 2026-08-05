"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, CheckCircle2, DollarSign, Zap, Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxStorageGB: number;
  includedModules: string[];
  isPopular?: boolean;
}

const INITIAL_PLANS: SubscriptionPlan[] = [
  { id: "1", name: "Starter SaaS Plan", priceMonthly: 4999, maxUsers: 25, maxStorageGB: 50, includedModules: ["HRMS", "ESS", "Finance Basics"] },
  { id: "2", name: "Enterprise Growth", priceMonthly: 14999, maxUsers: 250, maxStorageGB: 500, includedModules: ["HRMS", "Payroll", "Finance", "CRM", "Inventory"], isPopular: true },
  { id: "3", name: "Global Enterprise Unlimited", priceMonthly: 49999, maxUsers: 10000, maxStorageGB: 5000, includedModules: ["All 24 Platform Modules", "Dedicated DB", "SLA 99.99%"] },
];

export function LicensingBillingManager() {
  const [plans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licensing & SaaS Billing Center"
        subtitle="Manage subscription tiers, user quota limits, licensing keys, automated billing invoices, and payment histories"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Licensing & Billing" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Subscription Tier
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={`hover:border-indigo-500 transition-colors ${p.isPopular ? "border-indigo-500 shadow-md" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
                  <CardDescription className="text-xs">Up to {p.maxUsers.toLocaleString()} Users • {p.maxStorageGB}GB Storage</CardDescription>
                </div>
                {p.isPopular && <Badge variant="success">Most Popular</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{p.priceMonthly.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground"> / Month</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-muted-foreground">Included Features:</p>
                {p.includedModules.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full text-xs" variant={p.isPopular ? "default" : "outline"}>
                Configure Tier Limits
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
