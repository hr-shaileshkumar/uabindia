"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { financeApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError } from "@/lib/notifications";
import { erpButtonClassName, erpFormInputClassName, erpFormLabelClassName } from "@/components/erp/erpStyles";

type GstSummary = {
  invoiceCount?: number;
  outputCgst?: number;
  outputSgst?: number;
  outputIgst?: number;
  outputTax?: number;
};

type Gstr1 = {
  period?: string;
  invoiceCount?: number;
  taxable?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax?: number;
  invoiceValue?: number;
};

const inr = (v?: number) => `₹${(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function TaxManagementRoute() {
  const [summary, setSummary] = useState<GstSummary>({});
  const [gstr1, setGstr1] = useState<Gstr1>({});
  const [taxable, setTaxable] = useState("10000");
  const [rate, setRate] = useState("18");
  const [fromState, setFromState] = useState("KA");
  const [toState, setToState] = useState("KA");
  const [calc, setCalc] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [sum, g1] = await Promise.all([financeApi.tax.summary(), financeApi.tax.gstr1()]);
        setSummary((sum.data ?? {}) as GstSummary);
        setGstr1((g1.data ?? {}) as Gstr1);
      } catch (err) {
        const message = getApiErrorMessage(err, "Failed to load GST data.");
        setError(message);
        notifyError(message, "GST");
      }
    };
    void load();
  }, []);

  const handleCalc = async () => {
    try {
      const res = await financeApi.tax.calculate({
        taxableAmount: Number(taxable) || 0,
        taxRate: Number(rate) || 18,
        fromState,
        toState,
      });
      setCalc(res.data as Record<string, unknown>);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "GST calculate failed."), "GST");
    }
  };

  return (
    <StandardPageLayout title="GST / Tax Management" subtitle="Place-of-supply GST split, output tax summary, and GSTR-1 from posted sales invoices." eyebrow="Finance" icon="globe">
      {error && <div className="erp-alert-error">{error}</div>}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="erp-stat-card"><p className="text-xs text-slate-500">Output tax</p><p className="text-lg font-semibold">{inr(summary.outputTax)}</p></div>
        <div className="erp-stat-card"><p className="text-xs text-slate-500">CGST</p><p className="text-lg font-semibold">{inr(summary.outputCgst)}</p></div>
        <div className="erp-stat-card"><p className="text-xs text-slate-500">SGST</p><p className="text-lg font-semibold">{inr(summary.outputSgst)}</p></div>
        <div className="erp-stat-card"><p className="text-xs text-slate-500">IGST</p><p className="text-lg font-semibold">{inr(summary.outputIgst)}</p></div>
      </div>
      <section className="erp-panel mt-4">
        <div className="erp-panel-header erp-keep"><h2 className="erp-panel-title">GST calculator</h2></div>
        <div className="erp-panel-body grid gap-3 sm:grid-cols-5">
          <div><label className={erpFormLabelClassName}>Taxable</label><input className={erpFormInputClassName} value={taxable} onChange={(e) => setTaxable(e.target.value)} /></div>
          <div><label className={erpFormLabelClassName}>Rate %</label><input className={erpFormInputClassName} value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div><label className={erpFormLabelClassName}>From state</label><input className={erpFormInputClassName} value={fromState} onChange={(e) => setFromState(e.target.value)} /></div>
          <div><label className={erpFormLabelClassName}>To state</label><input className={erpFormInputClassName} value={toState} onChange={(e) => setToState(e.target.value)} /></div>
          <div className="flex items-end"><button type="button" className={erpButtonClassName.primary} onClick={() => void handleCalc()}>Calculate</button></div>
        </div>
        {calc && <p className="px-4 pb-4 text-sm text-slate-600">CGST {String(calc.cgst)} · SGST {String(calc.sgst)} · IGST {String(calc.igst)} · Total {String(calc.invoiceTotal)} {calc.interState ? "(inter-state)" : "(intra-state)"}</p>}
      </section>
      <section className="erp-panel mt-4">
        <div className="erp-panel-header erp-keep"><h2 className="erp-panel-title">GSTR-1 {gstr1.period}</h2></div>
        <div className="erp-panel-body text-sm text-slate-600">
          {gstr1.invoiceCount ?? 0} invoices · Taxable {inr(gstr1.taxable)} · Tax {inr(gstr1.totalTax)} · Invoice value {inr(gstr1.invoiceValue)}
        </div>
      </section>
    </StandardPageLayout>
  );
}
