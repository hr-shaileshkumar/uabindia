"use client";

import {
  TrendingUp,
  Users,
  Contact,
  KanbanSquare,
  FileText,
  ShoppingCart,
  Phone,
  Mail,
  Target,
} from "lucide-react";
import { ErpModuleDashboard } from "@/components/dynamic/ErpModuleDashboard";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: ROUTES.LEADS, label: "Leads & Pipeline", icon: TrendingUp, desc: "Qualification, scoring, and conversion" },
  { href: "/crm/pipeline", label: "Deal Pipeline", icon: KanbanSquare, desc: "Visual Kanban deal stage board" },
  { href: "/crm/contacts", label: "Contacts", icon: Contact, desc: "Business contacts and communication history" },
  { href: ROUTES.CUSTOMERS, label: "Customers", icon: Users, desc: "Account master and commercial terms" },
  { href: ROUTES.QUOTATIONS, label: "Quotations", icon: FileText, desc: "Proposals and pricing" },
  { href: ROUTES.SALES_ORDERS, label: "Sales Orders", icon: ShoppingCart, desc: "Confirmed demand and fulfilment" },
  { href: "/crm/activities", label: "Activities", icon: Phone, desc: "Calls, meetings, and follow-ups" },
  { href: "/crm/campaigns", label: "Campaigns", icon: Mail, desc: "Email marketing and outreach" },
];

export default function CrmHomePage() {
  return (
    <ErpModuleDashboard
      moduleKey="crm"
      title="Customer Relationship Management"
      subtitle="Leads, pipeline, contacts, and customer accounts — from first touch to closed deal."
      eyebrow="CRM"
      icon={Target}
      color="from-violet-600 via-purple-600 to-fuchsia-600"
      statsEndpoint="/crm/dashboard/stats"
      statsMapper={(data) => [
        { label: "Open Leads", value: data?.openLeads ?? 0, icon: TrendingUp, tone: "info" },
        { label: "Pipeline Value", value: data?.pipelineValue ? `₹${Number(data.pipelineValue).toLocaleString("en-IN")}` : "—", icon: Target, tone: "positive" },
        { label: "Deals Won (MTD)", value: data?.wonMTD ?? 0, icon: ShoppingCart, tone: "positive" },
        { label: "Customers", value: data?.totalCustomers ?? 0, icon: Users, tone: "neutral" },
      ]}
      kpis={[
        { label: "Open Leads", value: "—", icon: TrendingUp, tone: "info" },
        { label: "Pipeline Value", value: "—", icon: Target, tone: "positive" },
        { label: "Deals Won (MTD)", value: "—", icon: ShoppingCart, tone: "positive" },
        { label: "Customers", value: "—", icon: Users, tone: "neutral" },
      ]}
      links={LINKS}
      linksTitle="CRM Workspaces"
      activityEndpoint="/crm/activity"
    />
  );
}
