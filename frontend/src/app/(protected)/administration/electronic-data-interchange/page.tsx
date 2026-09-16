"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useState } from "react";
import {
  Sparkles,
  Check,
  CheckCircle2,
  FileText,
  Truck,
  Copy,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpTabBar, ErpTabPanel } from "@/components/workspace/page-kit";
import { platformApi } from "@/services/modules/administration";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type TabKey = "parser" | "generator-810" | "generator-856";

const SAMPLE_X12_EDI = `ISA*00*          *00*          *ZZ*PARTNER        *ZZ*ENTERPRISE       *260824*0640*U*00401*000000001*0*P*>~
GS*PO*PARTNER*ENTERPRISE*20260824*0640*1*X*004010~
ST*850*0001~
BEG*00*SA*PO-2026-9876**20260824~
CUR*BY*USD~
N1*BY*GLOBAL RETAIL CORP~
N1*ST*CENTRAL WAREHOUSE DOCK 4~
PO1*1*100*EA*45.50**VN*SKU-PRO-100~
PO1*2*50*EA*120.00**VN*SKU-ENT-200~
TDS*1055000~
SE*9*0001~
GE*1*1~
IEA*1*000000001~`;

function LegacyElectronicDataInterchangePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("parser");
  const [rawEdi, setRawEdi] = useState(SAMPLE_X12_EDI);
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // 810 Generator State
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-0042");
  const [invoiceAmount, setInvoiceAmount] = useState(10550);
  const [senderId, setSenderId] = useState("UABINDIA");
  const [receiverId, setReceiverId] = useState("PARTNER");
  const [generated810, setGenerated810] = useState<string | null>(null);
  const [generating810, setGenerating810] = useState(false);

  // 856 ASN Generator State
  const [shipmentNumber, setShipmentNumber] = useState("ASN-2026-7890");
  const [trackingNumber, setTrackingNumber] = useState("TRK987654321");
  const [generated856, setGenerated856] = useState<string | null>(null);
  const [generating856, setGenerating856] = useState(false);

  const handleParse = async () => {
    if (!rawEdi.trim()) {
      notifyError("Please enter raw EDI X12 content.");
      return;
    }

    try {
      setParsing(true);
      const res = await platformApi.edi.parse(rawEdi);
      setParsedResult(res.data?.data || res.data);
      notifySuccess("EDI X12 document parsed successfully.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to parse EDI payload. Check syntax."));
    } finally {
      setParsing(false);
    }
  };

  const handleGenerate810 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating810(true);
      const res = await platformApi.edi.generate810({
        invoiceNumber,
        invoiceDate: new Date().toISOString(),
        totalAmount: invoiceAmount,
        currency: "USD",
        senderId,
        receiverId,
        items: [
          { lineNumber: 1, itemCode: "SKU-PRO-100", quantity: 100, unitOfMeasure: "EA", unitPrice: 45.5, description: "Pro Line Component" },
          { lineNumber: 2, itemCode: "SKU-ENT-200", quantity: 50, unitOfMeasure: "EA", unitPrice: 120.0, description: "Enterprise Gateway" },
        ],
      });
      setGenerated810(res.data?.x12Content || res.data);
      notifySuccess("X12 EDI 810 Invoice generated.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to generate EDI 810 invoice."));
    } finally {
      setGenerating810(false);
    }
  };

  const handleGenerate856 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating856(true);
      const res = await platformApi.edi.generate856({
        shipmentNumber,
        shipDate: new Date().toISOString(),
        trackingNumber,
        senderId,
        receiverId,
        items: [
          { lineNumber: 1, itemCode: "SKU-PRO-100", quantity: 100, unitOfMeasure: "EA", description: "Pro Line Component" },
          { lineNumber: 2, itemCode: "SKU-ENT-200", quantity: 50, unitOfMeasure: "EA", description: "Enterprise Gateway" },
        ],
      });
      setGenerated856(res.data?.x12Content || res.data);
      notifySuccess("X12 EDI 856 ASN Shipment Notice generated.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to generate EDI 856 manifest."));
    } finally {
      setGenerating856(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notifySuccess("Copied to clipboard.");
  };

  const tabItems = [
    { key: "parser", label: "EDI X12 Parser & Validator" },
    { key: "generator-810", label: "EDI 810 Invoice Generator" },
    { key: "generator-856", label: "EDI 856 ASN Generator" },
  ];

  return (
    <StandardPageLayout
      title="Electronic Data Interchange (EDI X12) Studio"
      subtitle="B2B Electronic Data Interchange hub: Parse 850/810/856 documents and generate ANSI ASC X12 payloads."
      eyebrow="Administration / System"
      icon="code"
      meta={
        <HeaderSummary
          items={[
            { label: "Standard", value: "ANSI ASC X12", tone: "info" },
            { label: "Documents", value: "850, 810, 856", tone: "success" },
            { label: "Delimiter Syntax", value: "* / ~", tone: "warning" },
            { label: "Engine Status", value: "Active", tone: "success" },
          ]}
        />
      }
    >
      <ErpTabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      {/* Tab 1: Parser */}
      <ErpTabPanel hidden={activeTab !== "parser"}>
        <CrudCard>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Raw ANSI X12 Document Payload</h3>
                <p className="text-xs text-slate-500">
                  Paste X12 Purchase Orders (850), Invoices (810), or Ship Notices (856) to extract typed JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRawEdi(SAMPLE_X12_EDI)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Load Sample 850 PO
              </button>
            </div>

            <textarea
              className="w-full rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs text-emerald-300 leading-relaxed min-h-48 focus:border-indigo-500 focus:outline-none"
              value={rawEdi}
              onChange={(e) => setRawEdi(e.target.value)}
              placeholder="Paste raw ISA*... EDI stream here"
            />

            <div className="flex justify-end">
              <button
                type="button"
                disabled={parsing}
                onClick={() => void handleParse()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {parsing ? "Validating & Parsing..." : "Parse EDI Document"}
              </button>
            </div>

            {parsedResult && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Successfully Parsed Document
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(JSON.stringify(parsedResult, null, 2))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div className="rounded-lg bg-white p-3 border">
                    <span className="text-slate-400 font-medium">Doc Type</span>
                    <p className="font-bold text-slate-900 mt-0.5">{parsedResult.documentType || "850 PO"}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border">
                    <span className="text-slate-400 font-medium">Order Number</span>
                    <p className="font-bold text-slate-900 mt-0.5">{parsedResult.documentNumber || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border">
                    <span className="text-slate-400 font-medium">Sender ID</span>
                    <p className="font-mono text-slate-900 mt-0.5">{parsedResult.senderId || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border">
                    <span className="text-slate-400 font-medium">Total Amount</span>
                    <p className="font-bold text-emerald-600 mt-0.5">
                      {parsedResult.currency || "USD"} {parsedResult.totalAmount || "0"}
                    </p>
                  </div>
                </div>

                <pre className="max-h-72 overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-300 leading-relaxed">
                  <code>{JSON.stringify(parsedResult, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </CrudCard>
      </ErpTabPanel>

      {/* Tab 2: 810 Invoice Generator */}
      <ErpTabPanel hidden={activeTab !== "generator-810"}>
        <CrudCard>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Generate ANSI X12 810 Electronic Invoice</h3>
              <p className="text-xs text-slate-500">
                Produces standard X12 EDI 810 transaction sets formatted for retail & supplier EDI networks.
              </p>
            </div>

            <form onSubmit={handleGenerate810} className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Invoice Number *</label>
                <input
                  className="erp-input mt-1"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Total Invoice Amount (USD) *</label>
                <input
                  type="number"
                  className="erp-input mt-1"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Sender Partner ID *</label>
                <input
                  className="erp-input mt-1 font-mono uppercase"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Receiver Partner ID *</label>
                <input
                  className="erp-input mt-1 font-mono uppercase"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={generating810}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  {generating810 ? "Generating..." : "Generate X12 810 Payload"}
                </button>
              </div>
            </form>

            {generated810 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-slate-300">Generated X12 810 Stream</span>
                  <button
                    type="button"
                    onClick={() => copyText(generated810)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy Payload"}
                  </button>
                </div>
                <pre className="font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto p-2">
                  <code>{generated810}</code>
                </pre>
              </div>
            )}
          </div>
        </CrudCard>
      </ErpTabPanel>

      {/* Tab 3: 856 ASN Generator */}
      <ErpTabPanel hidden={activeTab !== "generator-856"}>
        <CrudCard>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Generate ANSI X12 856 Advance Ship Notice (ASN)</h3>
              <p className="text-xs text-slate-500">
                Produces standard X12 EDI 856 dispatch advice and container shipment manifests.
              </p>
            </div>

            <form onSubmit={handleGenerate856} className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Shipment / ASN Reference *</label>
                <input
                  className="erp-input mt-1"
                  value={shipmentNumber}
                  onChange={(e) => setShipmentNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Courier Tracking Number *</label>
                <input
                  className="erp-input mt-1 font-mono"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Sender Partner ID *</label>
                <input
                  className="erp-input mt-1 font-mono uppercase"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Receiver Partner ID *</label>
                <input
                  className="erp-input mt-1 font-mono uppercase"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={generating856}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Truck className="h-4 w-4" />
                  {generating856 ? "Generating..." : "Generate X12 856 Manifest"}
                </button>
              </div>
            </form>

            {generated856 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-semibold text-slate-300">Generated X12 856 Stream</span>
                  <button
                    type="button"
                    onClick={() => copyText(generated856)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy Payload"}
                  </button>
                </div>
                <pre className="font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto p-2">
                  <code>{generated856}</code>
                </pre>
              </div>
            )}
          </div>
        </CrudCard>
      </ErpTabPanel>
    </StandardPageLayout>
  );
}

export const PlatformEdiStudioPage = ElectronicDataInterchangePage;

export default function ElectronicDataInterchangePage() {
  return (
    <DynamicPage
      pageKey="administration.electronic-data-interchange"
      fallback={<LegacyElectronicDataInterchangePage />}
      renderMode="auto"
    />
  );
}
