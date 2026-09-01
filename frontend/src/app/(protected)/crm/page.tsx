"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { ModuleWorkspaceHub } from "@/components/workspace/module-workspace-hub";
import {
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/workspace/styles";
import { ROUTES } from "@/constants/routes";
import { crmApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";

const LINKS = [
  { href: ROUTES.LEADS, label: "Leads", icon: TrendingUp, desc: "Pipeline, qualification, and conversion" },
  { href: ROUTES.CUSTOMERS, label: "Customers", icon: Users, desc: "Account master and commercial terms" },
  { href: ROUTES.QUOTATIONS, label: "Quotations", icon: FileText, desc: "Proposals and pricing" },
  { href: ROUTES.SALES_ORDERS, label: "Sales orders", icon: ShoppingCart, desc: "Confirmed demand and fulfilment" },
];

type LeadRow = { id: string; leadName?: string; status?: string };
type CustomerRow = { id: string; name?: string; customerName?: string };

export default function CrmHomePage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([crmApi.leads.getAll(1, 20), crmApi.customers.getAll(1, 20)])
      .then(([leadRes, customerRes]) => {
        if (!alive) return;
        const leadPayload = leadRes.data as { items?: LeadRow[]; data?: LeadRow[] } | LeadRow[];
        const customerPayload = customerRes.data as { items?: CustomerRow[]; data?: CustomerRow[] } | CustomerRow[];
        setLeads(Array.isArray(leadPayload) ? leadPayload : leadPayload.items ?? leadPayload.data ?? []);
        setCustomers(
          Array.isArray(customerPayload) ? customerPayload : customerPayload.items ?? customerPayload.data ?? [],
        );
      })
      .catch((err) => {
        if (!alive) return;
        setError(getApiErrorMessage(err, "Could not load CRM snapshot."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const openLeads = leads.filter((lead) => (lead.status || "").toLowerCase() !== "converted").length;

  return (
    <ModuleWorkspaceHub
      title="CRM"
      subtitle="Demand generation through to customer accounts — leads, quotations, and the commercial master."
      eyebrow="Buy & sell"
      icon="contact-round"
      loading={loading}
      error={error}
      links={LINKS}
      linksTitle="CRM workspaces"
      stats={[
        { label: "Leads", value: leads.length, helper: "In pipeline", href: ROUTES.LEADS, icon: TrendingUp },
        { label: "Open", value: openLeads, helper: "Not converted", href: ROUTES.LEADS, icon: TrendingUp },
        { label: "Customers", value: customers.length, helper: "Accounts", href: ROUTES.CUSTOMERS, icon: Users },
        { label: "Quotations", value: "Open desk", helper: "Commercial", href: ROUTES.QUOTATIONS, icon: FileText },
      ]}
    >
      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Recent leads</h2>
          <Link href={ROUTES.LEADS} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
            View all
          </Link>
        </div>
        <div className={`${erpPanelBodyClassName} space-y-2 text-sm`}>
          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : leads.slice(0, 6).length === 0 ? (
            <p className="text-slate-500">No leads yet.</p>
          ) : (
            leads.slice(0, 6).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="truncate font-medium text-slate-800">{lead.leadName || lead.id}</span>
                <span className="text-xs text-slate-500">{lead.status || "New"}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </ModuleWorkspaceHub>
  );
}
