"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WorkflowQueuePage, { type WorkflowQueueItem } from "@/components/erp/WorkflowQueuePage";
import { appApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type ApprovalDto = {
  id: string;
  moduleKey?: string;
  entityType?: string;
  entityId?: string;
  currentStep?: number;
  status?: string;
  requestedBy?: string;
  requestedAt?: string;
  comments?: string;
};

export default function ApprovalsQueuePage() {
  const [rows, setRows] = useState<ApprovalDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Pending");
  const [selected, setSelected] = useState<WorkflowQueueItem | null>(null);
  const [comments, setComments] = useState("");
  const [deciding, setDeciding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appApi.approvals.list(status);
      setRows((Array.isArray(data) ? data : []) as ApprovalDto[]);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load approvals."));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const items: WorkflowQueueItem[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .map((row) => ({
        id: row.id,
        title: `${row.moduleKey || "Module"} · ${row.entityType || "Request"}`,
        subtitle: row.comments || `Entity ${row.entityId || "—"}`,
        meta: row.requestedBy ? `Requested by ${row.requestedBy}` : undefined,
        status: row.status || status,
        date: row.requestedAt,
        canDecide: (row.status || status) === "Pending",
      }))
      .filter(
        (item) =>
          !q ||
          item.title.toLowerCase().includes(q) ||
          (item.subtitle ?? "").toLowerCase().includes(q) ||
          (item.meta ?? "").toLowerCase().includes(q)
      );
  }, [rows, search, status]);

  const decide = async (item: WorkflowQueueItem, approve: boolean) => {
    try {
      setDeciding(true);
      if (approve) {
        await appApi.approvals.approve(item.id, { comments: comments || undefined });
        notifySuccess("Request approved.");
      } else {
        await appApi.approvals.reject(item.id, { comments: comments || undefined });
        notifySuccess("Request rejected.");
      }
      setSelected(null);
      setComments("");
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, approve ? "Approve failed." : "Reject failed."));
    } finally {
      setDeciding(false);
    }
  };

  return (
    <WorkflowQueuePage
      title="Approvals"
      icon="git-branch"
      loading={loading}
      error={error}
      items={items}
      search={search}
      onSearchChange={setSearch}
      onRefresh={() => void load()}
      stats={[
        { label: "In queue", value: items.length, tone: "info" },
        { label: "Filter", value: status, tone: status === "Pending" ? "warning" : "neutral" },
      ]}
      statusFilter={
        <div className="min-w-40">
          <label className="erp-label">Status</label>
          <select className="erp-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      }
      selected={selected}
      onSelect={setSelected}
      comments={comments}
      onCommentsChange={setComments}
      deciding={deciding}
      onApprove={(item) => void decide(item, true)}
      onReject={(item) => void decide(item, false)}
      emptyMessage="No approval requests for this filter."
    />
  );
}
