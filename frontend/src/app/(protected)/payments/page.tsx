"use client";

import { useCallback, useEffect, useState } from "react";
import { hrApi } from "@/services/hrApi";
import PageShell from "@/features/erp/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PaymentRow = {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentType: string;
  partyName?: string;
  amount: number;
  paymentMode: string;
  status: string;
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentType: "Paid",
    partyName: "",
    amount: "",
    paymentMode: "BankTransfer",
    referenceNumber: "",
    remarks: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.erp.payments.list(1, 50);
      setRows((res.data?.data as PaymentRow[]) || []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await hrApi.erp.payments.create({
        paymentDate: new Date(form.paymentDate).toISOString(),
        paymentType: form.paymentType,
        partyName: form.partyName || undefined,
        amount,
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber || undefined,
        remarks: form.remarks || undefined,
      });
      setTab("list");
      setForm((f) => ({ ...f, amount: "", partyName: "", referenceNumber: "", remarks: "" }));
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed (Admin may be required).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Payments" subtitle="Record money in and money out">
      {error && <div className="erp-alert-error text-sm">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Payments</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">All payment records</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Money In</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => r.paymentType === 'Received').length}</p><p className="erp-kpi-meta">Inbound payments</p></div>
        <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Money Out</p><p className="erp-kpi-value erp-kpi-value-danger">{rows.filter(r => r.paymentType === 'Paid').length}</p><p className="erp-kpi-meta">Outbound payments</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Amount</p><p className="erp-kpi-value">{rows.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of all amounts</p></div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="new">New payment</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Recent payments</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && rows.length === 0 ? (
                <div className="erp-loading">Loading…</div>
              ) : rows.length === 0 ? (
                <div className="erp-empty">No payments yet.</div>
              ) : (
                <div className="erp-table-wrap border-0 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Number</th>
                        <th className="erp-th">Date</th>
                        <th className="erp-th">Type</th>
                        <th className="erp-th">Party</th>
                        <th className="erp-th text-right">Amount</th>
                        <th className="erp-th">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="erp-tr">
                          <td className="erp-td font-medium text-slate-900">{r.paymentNumber}</td>
                          <td className="erp-td">{String(r.paymentDate).slice(0, 10)}</td>
                          <td className="erp-td">{r.paymentType}</td>
                          <td className="erp-td">{r.partyName ?? "—"}</td>
                          <td className="erp-td text-right tabular-nums">₹{Number(r.amount).toLocaleString()}</td>
                          <td className="erp-td">{r.paymentMode}</td>
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
              <CardTitle>Record payment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Type</label>
                <select
                  value={form.paymentType}
                  onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}
                  className="erp-select mt-1"
                >
                  <option value="Paid">Paid (out)</option>
                  <option value="Received">Received (in)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Party name</label>
                <input
                  value={form.partyName}
                  onChange={(e) => setForm((f) => ({ ...f, partyName: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Amount</label>
                <input
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="erp-input mt-1"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                  className="erp-select mt-1"
                >
                  <option value="Cash">Cash</option>
                  <option value="BankTransfer">Bank transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Reference</label>
                <input
                  value={form.referenceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600">Remarks</label>
                <input
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div className="md:col-span-2 erp-form-actions">
                <Button type="button" variant="outline" onClick={() => setTab("list")}>Cancel</Button>
                <Button type="button" onClick={() => void save()} disabled={loading}>
                  Save payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
