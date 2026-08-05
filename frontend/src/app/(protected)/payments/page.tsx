"use client";

import { useCallback, useEffect, useState } from "react";
import { hrApi } from "@/services/hrApi";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
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
      setForm((current) => ({ ...current, amount: "", partyName: "", referenceNumber: "", remarks: "" }));
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed (Admin may be required).");
    } finally {
      setLoading(false);
    }
  };

  const moneyInCount = rows.filter((row) => row.paymentType === "Received").length;
  const moneyOutCount = rows.filter((row) => row.paymentType === "Paid").length;
  const totalAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);

  return (
    <StandardPageLayout
      title="Payments"
      subtitle="Record receipts and disbursements in one finance transaction workspace."
      eyebrow="Finance / Treasury"
      icon="wallet"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Payments", value: rows.length, helper: "records" },
            { label: "Money In", value: moneyInCount, tone: "positive" },
            { label: "Money Out", value: moneyOutCount, tone: "danger" },
            { label: "Amount", value: `Rs ${totalAmount.toLocaleString("en-IN")}`, tone: "info" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error text-sm">{error}</div>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="erp-tabs-list">
          <TabsTrigger value="list" className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active">List</TabsTrigger>
          <TabsTrigger value="new" className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active">New Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <CrudCard title="Recent Payments" description="Keep receipts and disbursements in one dense treasury ledger.">
              {loading && rows.length === 0 ? (
                <div className="erp-loading">Loading...</div>
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
                      {rows.map((row) => (
                        <tr key={row.id} className="erp-tr">
                          <td className="erp-td font-medium text-slate-900">{row.paymentNumber}</td>
                          <td className="erp-td">{String(row.paymentDate).slice(0, 10)}</td>
                          <td className="erp-td">{row.paymentType}</td>
                          <td className="erp-td">{row.partyName ?? "-"}</td>
                          <td className="erp-td text-right tabular-nums">Rs {Number(row.amount).toLocaleString()}</td>
                          <td className="erp-td">{row.paymentMode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
          </CrudCard>
        </TabsContent>

        <TabsContent value="new">
          <Card className="erp-panel">
            <CardHeader className="border-b border-slate-100 bg-white/75">
              <CardTitle>Record Payment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600">Date</label>
                <input type="date" value={form.paymentDate} onChange={(e) => setForm((current) => ({ ...current, paymentDate: e.target.value }))} className="erp-input mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Type</label>
                <select value={form.paymentType} onChange={(e) => setForm((current) => ({ ...current, paymentType: e.target.value }))} className="erp-select mt-1">
                  <option value="Paid">Paid (out)</option>
                  <option value="Received">Received (in)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Party Name</label>
                <input value={form.partyName} onChange={(e) => setForm((current) => ({ ...current, partyName: e.target.value }))} className="erp-input mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Amount</label>
                <input value={form.amount} onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))} className="erp-input mt-1" inputMode="decimal" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Mode</label>
                <select value={form.paymentMode} onChange={(e) => setForm((current) => ({ ...current, paymentMode: e.target.value }))} className="erp-select mt-1">
                  <option value="Cash">Cash</option>
                  <option value="BankTransfer">Bank transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Reference</label>
                <input value={form.referenceNumber} onChange={(e) => setForm((current) => ({ ...current, referenceNumber: e.target.value }))} className="erp-input mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600">Remarks</label>
                <input value={form.remarks} onChange={(e) => setForm((current) => ({ ...current, remarks: e.target.value }))} className="erp-input mt-1" />
              </div>
              <div className="md:col-span-2 erp-form-actions">
                <Button type="button" variant="outline" onClick={() => setTab("list")}>Cancel</Button>
                <Button type="button" onClick={() => void save()} disabled={loading}>
                  Save Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
}
