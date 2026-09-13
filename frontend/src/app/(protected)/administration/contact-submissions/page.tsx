"use client";

import { useMemo, useState } from "react";
import { Mail, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdministrationGlobalPageShell, KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpRowActions } from "@/components/workspace/page-kit";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  mapContactSubmission,
  useContactSubmissionMutations,
  useContactSubmissions,
} from "@/features/administration/hooks/useContactSubmissions";

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

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.companyName && l.companyName.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || l.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

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
    <AdministrationGlobalPageShell
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
      listKey="platform-contact-submissions"
      listRows={filteredLeads}
      getRowId={(row) => row.id}
      emptyMessage={
        isError
          ? getApiErrorMessage(error, "Failed to load contact submissions.")
          : "No contact submissions found."
      }
      listColumns={[
        { key: "name", label: "Contact Name & Company", dataType: "string" },
        { key: "email", label: "Email & Phone", dataType: "string" },
        { key: "message", label: "Inquiry Message Excerpt", dataType: "string" },
        { key: "createdAt", label: "Received At", dataType: "date" },
        { key: "status", label: "Status", dataType: "string" },
        { key: "actions", label: "Actions", locked: true },
      ]}
      renderListRow={(l) => (
        <>
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
          <td className="erp-td">
            <ErpRowActions
              onView={{ label: "Inspect", onClick: () => setSelectedLead(l) }}
            />
          </td>
        </>
      )}
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
    />
  );
}
