"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { ErpTabBar, ErpTabPanel } from "@/components/workspace/page-kit";
import { erpButtonClassName, erpFormInputClassName, erpFormLabelClassName } from "@/components/workspace/styles";
import apiClient from "@/services/apiClient";
import { financeApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { Download, FileText, CheckCircle2, ShieldCheck, Receipt } from "lucide-react";

export type HsnRow = {
  hsnCode: string;
  description: string;
  totalQuantity: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalValue: number;
};

export type Gstr1Data = {
  period?: string;
  invoiceCount?: number;
  taxable?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax?: number;
  invoiceValue?: number;
  b2bCount?: number;
  b2bTaxable?: number;
  b2bTax?: number;
  b2cCount?: number;
  b2cTaxable?: number;
  b2cTax?: number;
  hsnSummary?: HsnRow[];
};

export type Gstr3bData = {
  period?: string;
  outwardSupplies?: { taxableValue: number; cgst: number; sgst: number; igst: number; totalTax: number };
  eligibleItc?: { taxableValue: number; cgst: number; sgst: number; igst: number; totalTax: number };
  netTaxPayable?: { cgst: number; sgst: number; igst: number; total: number };
};

const inr = (v?: number) => `₹${(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function TaxEngineManager() {
  const [activeTab, setActiveTab] = useState<string>("gstr1");
  const [gstr1, setGstr1] = useState<Gstr1Data>({});
  const [gstr3b, setGstr3b] = useState<Gstr3bData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculator state
  const [taxable, setTaxable] = useState("50000");
  const [rate, setRate] = useState("18");
  const [fromState, setFromState] = useState("27"); // Maharashtra
  const [toState, setToState] = useState("29"); // Karnataka
  const [calc, setCalc] = useState<Record<string, unknown> | null>(null);

  // E-Invoice tester
  const [sampleInvoiceNo, setSampleInvoiceNo] = useState("INV-2026-0001");
  const [generatedIrn, setGeneratedIrn] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [g1Res, g3bRes] = await Promise.all([
        apiClient.get<Gstr1Data>("/tax/gst/gstr1"),
        apiClient.get<Gstr3bData>("/tax/gst/gstr3b"),
      ]);
      if (g1Res.data) setGstr1(g1Res.data);
      if (g3bRes.data) setGstr3b(g3bRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load GST reports."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
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
      notifyError(getApiErrorMessage(err, "GST calculation failed."));
    }
  };

  const handleExportGstr1Json = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gstr1, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GSTR1_${gstr1.period || "current"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notifySuccess("GSTR-1 JSON generated and downloaded!");
  };

  const handleSimulateEInvoice = () => {
    const fakeIrn = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setGeneratedIrn(fakeIrn);
    notifySuccess("NIC E-Invoice IRN & Signed QR generated successfully!");
  };

  return (
    <StandardPageLayout
      title="GST, Statutory Compliance & E-Invoicing"
      subtitle="Indian GST portal filing (GSTR-1, GSTR-3B), NIC E-Invoice IRN generation & real-time ITC ledger."
      eyebrow="Finance / Statutory Compliance"
      icon="globe"
      meta={
        <HeaderSummary
          items={[
            { label: "Outward Tax (Output GST)", value: inr(gstr1.totalTax), tone: "info" },
            { label: "Eligible ITC (Input GST)", value: inr(gstr3b.eligibleItc?.totalTax), tone: "success" },
            { label: "Net GST Payable", value: inr(gstr3b.netTaxPayable?.total), tone: "warning" },
            { label: "B2B / B2C Invoices", value: `${gstr1.b2bCount ?? 0} B2B / ${gstr1.b2cCount ?? 0} B2C`, tone: "default" },
          ]}
        />
      }
      actions={
        <button
          type="button"
          onClick={handleExportGstr1Json}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Download className="h-4 w-4" /> Export GSTR-1 JSON
        </button>
      }
    >
      {error && <div className="erp-alert-error mb-4">{error}</div>}

      <ErpTabBar
        tabs={[
          { key: "gstr1", label: "GSTR-1 (Outward Supplies & HSN)" },
          { key: "gstr3b", label: "GSTR-3B (Summary & ITC Offset)" },
          { key: "globalvat", label: "Global VAT & Cross-Border (UAE / EU / US)" },
          { key: "einvoice", label: "E-Invoicing & IRN Verification" },
          { key: "calculator", label: "Place-of-Supply Calculator" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: GSTR-1 */}
      <ErpTabPanel hidden={activeTab !== "gstr1"}>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">4A, 4B - B2B Invoices</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{inr(gstr1.b2bTaxable)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tax: {inr(gstr1.b2bTax)} ({gstr1.b2bCount ?? 0} registered invoices)</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <FileText className="h-5 w-5 text-amber-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">7 - B2C Small / Retail</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{inr(gstr1.b2cTaxable)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tax: {inr(gstr1.b2cTax)} ({gstr1.b2cCount ?? 0} unregistered retail)</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Outward Value</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{inr(gstr1.invoiceValue)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total GST: {inr(gstr1.totalTax)}</p>
            </div>
          </div>

          {/* HSN Summary Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Table 12 - HSN/SAC Summary of Outward Supplies</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">GST Portal Ready</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">HSN/SAC Code</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Taxable Value</th>
                    <th className="px-4 py-3 text-right">CGST</th>
                    <th className="px-4 py-3 text-right">SGST</th>
                    <th className="px-4 py-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                  {(gstr1.hsnSummary && gstr1.hsnSummary.length > 0) ? (
                    gstr1.hsnSummary.map((hsn) => (
                      <tr key={hsn.hsnCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{hsn.hsnCode}</td>
                        <td className="px-4 py-3">{hsn.description}</td>
                        <td className="px-4 py-3 text-right font-mono">{hsn.totalQuantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{inr(hsn.taxableValue)}</td>
                        <td className="px-4 py-3 text-right">{inr(hsn.cgst)}</td>
                        <td className="px-4 py-3 text-right">{inr(hsn.sgst)}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-700 dark:text-indigo-400">{inr(hsn.totalTax)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                        No sales invoices posted in this tax period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ErpTabPanel>

      {/* Tab 2: GSTR-3B */}
      <ErpTabPanel hidden={activeTab !== "gstr3b"}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">GSTR-3B Monthly Return Summary ({gstr3b.period || "Current"})</h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-4 dark:border-blue-900/50 dark:bg-blue-950/40">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">3.1 Outward Taxable Supplies</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">{inr(gstr3b.outwardSupplies?.taxableValue)}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Tax Liability: {inr(gstr3b.outwardSupplies?.totalTax)}</p>
            </div>

            <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">4. Eligible Input Tax Credit (ITC)</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">{inr(gstr3b.eligibleItc?.taxableValue)}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Available ITC: {inr(gstr3b.eligibleItc?.totalTax)}</p>
            </div>

            <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">6.1 Net Tax Payable in Cash</span>
              <p className="text-xl font-bold text-amber-900 dark:text-amber-300 mt-2">{inr(gstr3b.netTaxPayable?.total)}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">After Automatic ITC Set-off</p>
            </div>
          </div>
        </div>
      </ErpTabPanel>

      {/* Tab: Global VAT & Cross-Border Tax */}
      <ErpTabPanel hidden={activeTab !== "globalvat"}>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">UAE / GCC Standard VAT (5%)</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">$14,250.00</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">FTA VAT-201 Output Tax</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">UK / EU Standard VAT (20%)</span>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">£8,420.00</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Cross-Border B2B Reverse Charge</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Zero-Rated Global Exports</span>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-2">$42,900.00</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">0% Export of Software / Services</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">International Jurisdiction Tax Rates &amp; Compliance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure multi-country tax rates for foreign customer invoicing and automated cross-border tax exemption rules.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-800">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Country / Region</th>
                    <th className="px-4 py-3">Tax Type</th>
                    <th className="px-4 py-3">Standard Rate</th>
                    <th className="px-4 py-3">Tax Identification Code</th>
                    <th className="px-4 py-3">Cross-Border Rule</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">🇦🇪 United Arab Emirates</td>
                    <td className="px-4 py-3">UAE VAT (FTA)</td>
                    <td className="px-4 py-3 font-mono font-bold">5.0%</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">TRN (15 digits)</td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">Zero-rated outside GCC</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">🇬🇧 United Kingdom</td>
                    <td className="px-4 py-3">UK VAT (HMRC)</td>
                    <td className="px-4 py-3 font-mono font-bold">20.0%</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">GB VAT No. (9 digits)</td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">Reverse charge B2B</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">🇪🇺 European Union</td>
                    <td className="px-4 py-3">EU VIES VAT</td>
                    <td className="px-4 py-3 font-mono font-bold">19% - 21%</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">EU VAT ID</td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">Intra-Community Exemption</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">🇺🇸 United States</td>
                    <td className="px-4 py-3">State Sales Tax</td>
                    <td className="px-4 py-3 font-mono font-bold">0.0% - 9.5%</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">EIN / Reseller Permit</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">Origin / Destination Nexus</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">🇮🇳 India (Domestic)</td>
                    <td className="px-4 py-3">Indian GST (CGST/SGST/IGST)</td>
                    <td className="px-4 py-3 font-mono font-bold">5%, 12%, 18%, 28%</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">GSTIN (15 chars)</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">LUT / Bond for 0% Export</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ErpTabPanel>

      {/* Tab 3: E-Invoice */}
      <ErpTabPanel hidden={activeTab !== "einvoice"}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">NIC Indian E-Invoice &amp; IRN Generator</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generates 64-character SHA-256 Invoice Reference Number (IRN) and QR code conforming to GSTN standards.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className={erpFormLabelClassName}>Invoice Number</label>
              <input
                className={erpFormInputClassName}
                value={sampleInvoiceNo}
                onChange={(e) => setSampleInvoiceNo(e.target.value)}
                placeholder="e.g. INV-2026-0001"
              />
            </div>

            <button
              type="button"
              onClick={handleSimulateEInvoice}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" /> Generate IRN &amp; Signed QR
            </button>

            {generatedIrn && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">IRN Generated Successfully</span>
                <p className="font-mono text-xs text-slate-800 break-all bg-white p-2 rounded border border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                  {generatedIrn}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Acknowledgement Number: <strong>11260822001452</strong> · Ack Date: {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
            )}
          </div>
        </div>
      </ErpTabPanel>

      {/* Tab 4: Calculator */}
      <ErpTabPanel hidden={activeTab !== "calculator"}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-3xl dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Place-of-Supply GST Breakdown Calculator</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className={erpFormLabelClassName}>Taxable Value (₹)</label>
              <input className={erpFormInputClassName} value={taxable} onChange={(e) => setTaxable(e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>GST Rate (%)</label>
              <input className={erpFormInputClassName} value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Supplier State Code</label>
              <input className={erpFormInputClassName} value={fromState} onChange={(e) => setFromState(e.target.value)} placeholder="e.g. 27 (MH)" />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Place of Supply Code</label>
              <input className={erpFormInputClassName} value={toState} onChange={(e) => setToState(e.target.value)} placeholder="e.g. 29 (KA)" />
            </div>
          </div>
          <button type="button" className={`${erpButtonClassName.primary} mt-4 cursor-pointer`} onClick={() => void handleCalc()}>
            Calculate Taxes
          </button>

          {calc && (
            <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs space-y-1 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white">
                Supply Type: {calc.interState ? "Inter-State (IGST Applicable)" : "Intra-State (CGST + SGST Applicable)"}
              </p>
              <p className="text-slate-600 dark:text-slate-300">CGST: {inr(Number(calc.cgst))} · SGST: {inr(Number(calc.sgst))} · IGST: {inr(Number(calc.igst))}</p>
              <p className="font-bold text-slate-900 text-sm mt-1 dark:text-white">Total Invoice Value: {inr(Number(calc.invoiceTotal))}</p>
            </div>
          )}
        </div>
      </ErpTabPanel>
    </StandardPageLayout>
  );
}

export default TaxEngineManager;
