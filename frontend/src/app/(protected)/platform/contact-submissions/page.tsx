"use client";

import React, { useState } from "react";
import { Mail, Eye, CheckCircle2, MessageSquare, Clock, UserCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  message: string;
  status: "New" | "In Progress" | "Resolved" | "Spam";
  createdAt: string;
}

const SEED_LEADS: LeadRow[] = [
  { id: "lead_1", name: "Rajesh Sharma", email: "rajesh@apollologistics.in", phone: "+91 98765 43210", companyName: "Apollo Logistics India", message: "Interested in Enterprise ERP deployment for 350 seats across 4 warehouses.", status: "New", createdAt: "2026-07-29 10:15" },
  { id: "lead_2", name: "Sarah Jenkins", email: "sarah@eurotech.de", phone: "+49 171 892019", companyName: "EuroTech GmbH", message: "Requesting demo for multi-currency general ledger accounting module.", status: "In Progress", createdAt: "2026-07-28 16:40" },
  { id: "lead_3", name: "Michael Vance", email: "mvance@acme.com", phone: "+1 415 892 1029", companyName: "Acme Retail Global", message: "Quotation request for custom white-label tenant portal.", status: "Resolved", createdAt: "2026-07-20 11:00" },
];

export default function ContactSubmissionsPage() {
  const [leads, setLeads] = useState<LeadRow[]>(SEED_LEADS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.companyName && l.companyName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || l.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Total Inbound Leads", value: leads.length, tone: "info", icon: <Mail className="h-3.5 w-3.5" />, subtext: "Inbound" },
    { label: "New Leads", value: leads.filter((l) => l.status === "New").length, tone: "warning", icon: <Clock className="h-3.5 w-3.5" />, subtext: "Action Needed" },
    { label: "In Progress", value: leads.filter((l) => l.status === "In Progress").length, tone: "positive", icon: <UserCheck className="h-3.5 w-3.5" />, subtext: "Engaged" },
    { label: "Resolved Deals", value: leads.filter((l) => l.status === "Resolved").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Closed" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Contact Submissions & Inbound Lead Register"
      subtitle="Review public marketing website contact form requests, demo inquiries, and enterprise sales leads."
      categoryTag="Sales Pipeline Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter contact name, email, company, or message..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "status",
          label: "All Statuses",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All Statuses", value: "all" },
            { label: "New", value: "new" },
            { label: "In Progress", value: "in progress" },
            { label: "Resolved", value: "resolved" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("all");
      }}
      isInspectorOpen={!!selectedLead}
      onInspectorClose={() => setSelectedLead(null)}
      inspectorTitle={selectedLead ? `Inbound Inquiry: ${selectedLead.name}` : "Lead Details"}
      inspectorSubTitle={selectedLead ? `Company: ${selectedLead.companyName || "N/A"}` : ""}
      inspectorContent={
        selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Full Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedLead.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedLead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLead.phone || "-"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Inquiry Message:</span>
                <p className="p-3 bg-white dark:bg-slate-950 border rounded text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedLead.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => notifySuccess(`Marked submission as In Progress.`)}>
                Mark In Progress
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
          </div>
        )
      }
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Contact Name & Company</th>
              <th className="erp-th">Email & Phone</th>
              <th className="erp-th">Inquiry Message Excerpt</th>
              <th className="erp-th">Received At</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((l) => (
              <tr key={l.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{l.name}</span>
                    <div className="text-[11px] text-slate-500">{l.companyName || "Independent Inquiry"}</div>
                  </div>
                </td>
                <td className="erp-td">
                  <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{l.email}</div>
                  <div className="font-mono text-[11px] text-slate-500">{l.phone || "-"}</div>
                </td>
                <td className="erp-td text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">{l.message}</td>
                <td className="erp-td text-xs text-slate-500">{l.createdAt}</td>
                <td className="erp-td">
                  <span className={l.status === "New" ? "erp-chip erp-chip-warning" : l.status === "In Progress" ? "erp-chip erp-chip-info" : "erp-chip erp-chip-success"}>
                    {l.status}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedLead(l)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
