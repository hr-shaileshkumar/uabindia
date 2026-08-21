"use client";

import React, { useMemo, useState } from "react";
import { Mail, Eye, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  mapContactSubmission,
  useContactSubmissionMutations,
  useContactSubmissions,
} from "@/features/platform/hooks/useContactSubmissions";

type LeadRow = ReturnType<typeof mapContactSubmission>;

export default function ContactSubmissionsPage() {
  const [page] = useState(1);
  const { data, isLoading, isError, error, refetch } = useContactSubmissions(page, 50);
  const { updateResolved } = useContactSubmissionMutations();

  const leads = useMemo(
    () => (data?.submissions ?? []).map(mapContactSubmission),
    [data?.submissions]
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.companyName && l.companyName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || l.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleMarkResolved = async (lead: LeadRow, isResolved: boolean) => {
    try {
      await updateResolved.mutateAsync({ id: lead.id, isResolved });
      notifySuccess(isResolved ? "Submission marked as resolved." : "Submission reopened.");
      setSelectedLead(null);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update submission."));
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "Total Inbound Leads", value: data?.total ?? leads.length, tone: "info", icon: <Mail className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Open Leads", value: leads.filter((l) => l.status === "New").length, tone: "warning", icon: <Clock className="h-3.5 w-3.5" />, subtext: "Unresolved" },
    { label: "Resolved", value: leads.filter((l) => l.status === "Resolved").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Closed" },
    { label: "Page Size", value: data?.limit ?? 50, tone: "info", icon: <UserCheck className="h-3.5 w-3.5" />, subtext: "Records" },
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
            { label: "Resolved", value: "resolved" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("all");
      }}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      isInspectorOpen={!!selectedLead}
      onInspectorClose={() => setSelectedLead(null)}
      inspectorTitle={selectedLead ? `Inbound Inquiry: ${selectedLead.name}` : "Lead Details"}
      inspectorSubTitle={selectedLead ? `Company: ${selectedLead.companyName || "N/A"}` : ""}
      inspectorContent={
        selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-bold">{selectedLead.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{selectedLead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono">{selectedLead.phone || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Message:</span>
                <p className="p-3 border rounded bg-[var(--bg-surface)] leading-relaxed">{selectedLead.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {selectedLead.status !== "Resolved" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateResolved.isPending}
                  onClick={() => void handleMarkResolved(selectedLead, true)}
                >
                  Mark Resolved
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateResolved.isPending}
                  onClick={() => void handleMarkResolved(selectedLead, false)}
                >
                  Reopen
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </div>
          </div>
        )
      }
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load contact submissions.")}
        </p>
      )}
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
            {isLoading ? (
              <tr>
                <td colSpan={6} className="erp-td text-center text-xs text-muted-foreground py-8">
                  Loading submissions…
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="erp-td text-center text-xs text-muted-foreground py-8">
                  No contact submissions found.
                </td>
              </tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.id} className="erp-tr hover:bg-[var(--bg-muted)]/60 transition-colors">
                  <td className="erp-td">
                    <div>
                      <span className="font-semibold text-xs">{l.name}</span>
                      <div className="text-[11px] text-muted-foreground">{l.companyName || "Independent Inquiry"}</div>
                    </div>
                  </td>
                  <td className="erp-td">
                    <div className="font-mono text-xs text-slate-900 dark:text-slate-100">{l.email}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{l.phone || "—"}</div>
                  </td>
                  <td className="erp-td text-xs text-muted-foreground max-w-xs truncate">{l.message}</td>
                  <td className="erp-td text-xs text-muted-foreground">{l.createdAt}</td>
                  <td className="erp-td">
                    <span className={l.status === "New" ? "erp-chip erp-chip-warning" : "erp-chip erp-chip-success"}>
                      {l.status}
                    </span>
                  </td>
                  <td className="erp-td text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-700 hover:text-slate-900" onClick={() => setSelectedLead(l)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
