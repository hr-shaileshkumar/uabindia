"use client";

import { useCallback, useEffect, useState } from "react";
import { hrApi } from "@/services/hrApi";
import PageShell from "@/features/erp/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ApprovalRow = {
  id: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  currentStep: number;
  status: string;
  requestedAt: string;
  comments?: string;
};

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.approvals.list("Pending");
      const data = res.data;
      setRows(Array.isArray(data) ? (data as ApprovalRow[]) : []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load approvals (check approval permissions).");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    try {
      setLoading(true);
      await hrApi.approvals.approve(id, { comments: comment[id] || undefined });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id: string) => {
    try {
      setLoading(true);
      await hrApi.approvals.reject(id, { comments: comment[id] || undefined });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Approvals"
      subtitle="Pending workflow requests"
      actions={
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      }
    >
      {error && <div className="erp-alert-warn text-sm">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending Approvals</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Awaiting decision</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Modules</p><p className="erp-kpi-value">{new Set(rows.map(r => r.moduleKey)).size}</p><p className="erp-kpi-meta">Distinct workflow modules</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Entity Types</p><p className="erp-kpi-value erp-kpi-value-success">{new Set(rows.map(r => r.entityType)).size}</p><p className="erp-kpi-meta">Types awaiting review</p></div>
        <div className="erp-kpi-card"><p className="erp-kpi-label">Oldest Step</p><p className="erp-kpi-value">{rows.length > 0 ? Math.max(...rows.map(r => r.currentStep || 1)) : 0}</p><p className="erp-kpi-meta">Max workflow step</p></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && rows.length === 0 ? (
            <div className="erp-loading">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="erp-empty">No pending approvals.</div>
          ) : (
            <div className="space-y-4">
              {rows.map((r) => (
                <div key={r.id} className="erp-panel erp-panel-body space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="font-semibold text-slate-900">{r.moduleKey}</span>
                    <span className="text-slate-600">{r.entityType}</span>
                    <span className="text-slate-500">Step {r.currentStep}</span>
                    <span className="text-slate-400">{new Date(r.requestedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 break-all">Entity: {r.entityId}</p>
                  <input
                    placeholder="Comment (optional)"
                    value={comment[r.id] || ""}
                    onChange={(e) => setComment((c) => ({ ...c, [r.id]: e.target.value }))}
                    className="erp-input w-full"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void approve(r.id)} disabled={loading}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void reject(r.id)} disabled={loading}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
