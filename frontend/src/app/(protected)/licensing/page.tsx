"use client";

import {
  CreditCard,
  Shield,
  Zap,
  HardDrive,
  Users,
  BarChart2,
  Package,
  Activity,
} from "lucide-react";
import { ErpModuleDashboard } from "@/components/dynamic/ErpModuleDashboard";

const LINKS = [
  { href: "/licensing/subscriptions", label: "Subscriptions", icon: CreditCard, desc: "Current plan, features, and renewal" },
  { href: "/licensing/billing-history", label: "Billing History", icon: Activity, desc: "Invoices, payments, and receipts" },
  { href: "/licensing/catalog", label: "Plan Catalog", icon: Package, desc: "Compare plans and upgrade" },
  { href: "/licensing/usage", label: "Usage Analytics", icon: BarChart2, desc: "Users, storage, and API consumption" },
  { href: "/licensing/integrations", label: "Add-on Integrations", icon: Zap, desc: "Third-party integration licenses" },
];

export default function LicensingPage() {
  return (
    <ErpModuleDashboard
      moduleKey="licensing"
      title="Subscription & Licensing"
      subtitle="Manage your subscription plan, billing, usage metrics, and add-on integrations."
      eyebrow="Licensing"
      icon={Shield}
      color="from-amber-500 via-orange-500 to-red-500"
      statsEndpoint="/licensing/dashboard/stats"
      statsMapper={(data) => [
        { label: "Current Plan", value: data?.planName ?? "—", icon: Shield, tone: "positive" },
        { label: "Active Users", value: `${data?.activeUsers ?? 0} / ${data?.maxUsers ?? "∞"}`, icon: Users, tone: "info" },
        { label: "Storage Used", value: data?.storageMb ? `${Math.round(data.storageMb / 1024 * 10) / 10} GB` : "—", icon: HardDrive, tone: "neutral" },
        { label: "Plan Expires", value: data?.endDate ?? "—", icon: CreditCard, tone: "warning" },
      ]}
      kpis={[
        { label: "Current Plan", value: "—", icon: Shield, tone: "positive" },
        { label: "Active Users", value: "—", icon: Users, tone: "info" },
        { label: "Storage Used", value: "—", icon: HardDrive, tone: "neutral" },
        { label: "Plan Expires", value: "—", icon: CreditCard, tone: "warning" },
      ]}
      links={LINKS}
      linksTitle="Licensing Management"
    />
  );
}
