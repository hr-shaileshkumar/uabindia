"use client";

import { useCallback, useEffect, useState } from "react";
import { hrApi } from "@/services/hrApi";
import PageShell from "@/features/erp/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CoaRow = { id: string; accountCode: string; accountName: string; isGroup: boolean };
type JeRow = {
  id: string;
  journalNumber: string;
  entryDate: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  description?: string;
};

type LineForm = { accountId: string; debitAmount: string; creditAmount: string; description: string };

export default function JournalEntriesPage() {
  const [accounts, setAccounts] = useState<CoaRow[]>([]);
  const [rows, setRows] = useState<JeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("list");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineForm[]>([
    { accountId: "", debitAmount: "", creditAmount: "0", description: "" },
    { accountId: "", debitAmount: "0", creditAmount: "", description: "" },
  ]);

  const loadAccounts = useCallback(async () => {
    const res = await hrApi.erp.chartOfAccounts.getAll();
    const raw = (res.data || []) as CoaRow[];
    setAccounts(raw.filter((a) => !a.isGroup));
  }, []);

  const loadJournals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.erp.journalEntries.list(1, 50);
      setRows((res.data?.data as JeRow[]) || []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load journals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
    void loadJournals();
  }, [loadAccounts, loadJournals]);

  const addLine = () =>
    setLines((prev) => [...prev, { accountId: "", debitAmount: "0", creditAmount: "0", description: "" }]);

  const updateLine = (i: number, patch: Partial<LineForm>) =>
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const saveDraft = async () => {
    setError(null);
    const payloadLines = lines
      .filter((l) => l.accountId)
      .map((l) => ({
        accountId: l.accountId,
        debitAmount: Number(l.debitAmount) || 0,
        creditAmount: Number(l.creditAmount) || 0,
        description: l.description || undefined,
      }));
    if (payloadLines.length < 2) {
      setError("Select at least two accounts.");
      return;
    }
    const td = payloadLines.reduce((s, l) => s + l.debitAmount, 0);
    const tc = payloadLines.reduce((s, l) => s + l.creditAmount, 0);
    if (td !== tc || td <= 0) {
      setError("Debits must equal credits and total must be greater than zero.");
      return;
    }
    try {
      setLoading(true);
      await hrApi.erp.journalEntries.create({
        entryDate: new Date(entryDate).toISOString(),
        description,
        lines: payloadLines,
      });
      setTab("list");
      setLines([
        { accountId: "", debitAmount: "", creditAmount: "0", description: "" },
        { accountId: "", debitAmount: "0", creditAmount: "", description: "" },
      ]);
      setDescription("");
      await loadJournals();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed (Admin role required to post journals).");
    } finally {
      setLoading(false);
    }
  };

  const postOne = async (id: string) => {
    try {
      setLoading(true);
      await hrApi.erp.journalEntries.post(id);
      await loadJournals();
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Post failed");
    } finally {
      setLoading(false);
    }
  };

  const removeDraft = async (id: string) => {
    try {
      setLoading(true);
      await hrApi.erp.journalEntries.deleteDraft(id);
      await loadJournals();
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Journal entries" subtitle="Draft, balance, and post double-entry journals">
      {error && <div className="erp-alert-error text-sm">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Journals</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Journal entries</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Posted</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => (r.status || '').toLowerCase() === 'posted').length}</p><p className="erp-kpi-meta">Finalized entries</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Draft</p><p className="erp-kpi-value">{rows.filter(r => (r.status || '').toLowerCase() === 'draft').length}</p><p className="erp-kpi-meta">Pending posting</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Debit</p><p className="erp-kpi-value">{rows.reduce((s, r) => s + (r.totalDebit || 0), 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of debits</p></div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="new">New draft</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Recent journals</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && rows.length === 0 ? (
                <div className="erp-loading">Loading…</div>
              ) : rows.length === 0 ? (
                <div className="erp-empty">No journal entries yet.</div>
              ) : (
                <div className="erp-table-wrap border-0 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Number</th>
                        <th className="erp-th">Date</th>
                        <th className="erp-th">Status</th>
                        <th className="erp-th text-right">Debit</th>
                        <th className="erp-th text-right">Credit</th>
                        <th className="erp-th">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="erp-tr">
                          <td className="erp-td font-medium text-slate-900">{r.journalNumber}</td>
                          <td className="erp-td">{r.entryDate?.slice?.(0, 10) ?? r.entryDate}</td>
                          <td className="erp-td">{r.status}</td>
                          <td className="erp-td text-right tabular-nums">{Number(r.totalDebit).toFixed(2)}</td>
                          <td className="erp-td text-right tabular-nums">{Number(r.totalCredit).toFixed(2)}</td>
                          <td className="erp-td">
                            <div className="flex flex-wrap gap-2">
                            {r.status === "Draft" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => postOne(r.id)} disabled={loading}>
                                  Post
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => removeDraft(r.id)} disabled={loading}>
                                  Delete
                                </Button>
                              </>
                            )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>New draft entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Entry date</label>
                  <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="erp-input mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  <input value={description} onChange={(e) => setDescription(e.target.value)} className="erp-input mt-1" />
                </div>
              </div>

              <div className="space-y-3">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <div className="md:col-span-5">
                      <label className="text-xs text-slate-500">Account</label>
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(i, { accountId: e.target.value })}
                        className="erp-select mt-1 py-2 text-sm"
                      >
                        <option value="">Select…</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.accountCode} — {a.accountName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500">Debit</label>
                      <input
                        value={line.debitAmount}
                        onChange={(e) => updateLine(i, { debitAmount: e.target.value })}
                        className="erp-input mt-1 py-2"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500">Credit</label>
                      <input
                        value={line.creditAmount}
                        onChange={(e) => updateLine(i, { creditAmount: e.target.value })}
                        className="erp-input mt-1 py-2"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-slate-500">Line note</label>
                      <input
                        value={line.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        className="erp-input mt-1 py-2"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="erp-form-actions">
                <Button type="button" variant="outline" onClick={addLine}>
                  Add line
                </Button>
                <Button type="button" variant="outline" onClick={() => setTab("list")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void saveDraft()} disabled={loading}>
                  Save draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
