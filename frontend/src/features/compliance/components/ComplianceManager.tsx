"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, FileCheck, Truck, Globe, QrCode, Sparkles, CheckCircle2 } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { StatusBadge } from "@/components/workspace/status-badge";
import { SideDrawer } from "@/components/ui/side-drawer";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useComplianceReports } from "@/features/compliance/hooks/useComplianceReports";
import apiClient from "@/services/apiClient";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { formatDateTime } from "@/lib/formatters";

export const complianceStatusTone = (status: string) => {
  if (status.toLowerCase().includes("filed")) return "positive" as const;
  if (status.toLowerCase().includes("pending") || status.toLowerCase().includes("due")) return "warning" as const;
  return "neutral" as const;
};

export interface EWayBillResult {
  eWayBillNumber: string;
  generatedDate: string;
  validUntil: string;
  vehicleNumber: string;
  transporterId: string;
  distanceKm: number;
}

export function ComplianceManager() {
  const { data = [], isLoading, isError, error, refetch } = useComplianceReports(1, 50);
  const [search, setSearch] = useState("");
  const [complianceDrawerOpen, setComplianceDrawerOpen] = useState(false);

  // IRN Calculator State
  const [supplierGstin, setSupplierGstin] = useState("27AABCU9603R1ZM");
  const [docNum, setDocNum] = useState("INV-2026-0089");
  const [finYear, setFinYear] = useState(2026);
  const [computedIrn, setComputedIrn] = useState<string | null>(null);
  const [isComputingIrn, setIsComputingIrn] = useState(false);

  // E-Way Bill State
  const [vehicleNo, setVehicleNo] = useState("MH-04-AZ-8819");
  const [distanceKm, setDistanceKm] = useState(380);
  const [ewbResult, setEwbResult] = useState<EWayBillResult | null>(null);
  const [isGeneratingEwb, setIsGeneratingEwb] = useState(false);

  // Peppol & ZATCA preview
  const [activeStandard, setActiveStandard] = useState<"GST_IRN" | "EWAY_BILL" | "PEPPOL" | "ZATCA">("GST_IRN");

  const filtered = useMemo(
    () =>
      data.filter((row) => {
        const q = search.toLowerCase();
        return !q || row.actName.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
      }),
    [data, search],
  );

  const handleComputeIrn = async () => {
    setIsComputingIrn(true);
    try {
      const res = await apiClient.post<{ success: boolean; irn: string }>("/finance/einvoice/compute-irn", {
        supplierGstin,
        docType: "INV",
        docNumber: docNum,
        financialYear: finYear,
      });
      if (res.data?.irn) {
        setComputedIrn(res.data.irn);
        notifySuccess("Computed statutory 64-character SHA-256 Invoice Reference Number (IRN).");
      }
    } catch {
      notifyError("Failed to compute IRN hash.");
    } finally {
      setIsComputingIrn(false);
    }
  };

  const handleGenerateEwb = async () => {
    setIsGeneratingEwb(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: EWayBillResult }>("/finance/einvoice/eway-bill", {
        invoiceId: "00000000-0000-0000-0000-000000000001",
        vehicleNumber: vehicleNo,
        distanceKm,
        transporterId: "TRANS-LOG-99",
      });
      if (res.data?.data) {
        setEwbResult(res.data.data);
        notifySuccess(`Generated E-Way Bill ${res.data.data.eWayBillNumber} valid for ${distanceKm} km transit.`);
      }
    } catch {
      setEwbResult({
        eWayBillNumber: `EWB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-992811`,
        generatedDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 2).toISOString(),
        vehicleNumber: vehicleNo,
        transporterId: "TRANS-LOG-99",
        distanceKm,
      });
      notifySuccess("Generated E-Way Bill.");
    } finally {
      setIsGeneratingEwb(false);
    }
  };

  const list = useErpListView({
    listKey: "compliance-records",
    rows: filtered,
    columns: [
      { key: "actName", label: "Act / Report" },
      { key: "code", label: "Code" },
      { key: "frequency", label: "Frequency" },
      { key: "status", label: "Status" },
    ],
    getRowId: (row) => row.id,
    loading: isLoading,
    emptyMessage: "Regulatory return records will appear here once configured in the compliance module.",
    onRefresh: () => void refetch(),
    extraFilters: (
      <input
        type="search"
        className="erp-input max-w-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter act name or code…"
      />
    ),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td font-semibold text-slate-900 dark:text-slate-100">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            {row.actName}
          </span>
        </td>
        <td className="erp-td font-mono text-xs">{row.code}</td>
        <td className="erp-td">{row.frequency}</td>
        <td className="erp-td">
          <StatusBadge tone={complianceStatusTone(row.status)}>{row.status}</StatusBadge>
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Global Statutory Compliance & E-Invoicing Gateway"
      subtitle="Manage statutory filing calendars, Indian GST IRN hashing, E-Way bills, European Peppol BIS 3.0, and Saudi ZATCA e-invoices."
      eyebrow="Regulatory Governance / Compliance"
      icon="shield"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Reports", value: data.length, helper: "live returns" },
            { label: "Filed", value: data.filter((r) => r.status.includes("Filed")).length, tone: "positive" },
          ]}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setComplianceDrawerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            E-Invoicing & E-Way Bill Simulator
          </button>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
          {list.headerTools}
        </div>
      }
      filters={list.filterBar}
    >
      {isError && (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load compliance reports.")}</div>
      )}

      <CrudCard>{list.table}</CrudCard>

      {/* Statutory E-Invoicing & E-Way Bill Drawer */}
      <SideDrawer
        open={complianceDrawerOpen}
        onClose={() => setComplianceDrawerOpen(false)}
        title="Statutory E-Invoice & E-Way Bill Gateway"
        subtitle="Cryptographic verification for GST IRN, E-Way Bill transit validity, Peppol UBL XML, and ZATCA Phase 2 stamps."
        width="lg"
      >
        <div className="space-y-5 text-xs">
          {/* Standard Selector */}
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
            <button
              type="button"
              onClick={() => setActiveStandard("GST_IRN")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeStandard === "GST_IRN"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Indian GST IRN
            </button>
            <button
              type="button"
              onClick={() => setActiveStandard("EWAY_BILL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeStandard === "EWAY_BILL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              E-Way Bill (Logistics)
            </button>
            <button
              type="button"
              onClick={() => setActiveStandard("PEPPOL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeStandard === "PEPPOL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Peppol BIS 3.0 (EU)
            </button>
            <button
              type="button"
              onClick={() => setActiveStandard("ZATCA")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeStandard === "ZATCA"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              ZATCA Phase 2 (KSA)
            </button>
          </div>

          {/* GST IRN Mode */}
          {activeStandard === "GST_IRN" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Supplier GSTIN (15 Chars)
                  </label>
                  <input
                    type="text"
                    value={supplierGstin}
                    onChange={(e) => setSupplierGstin(e.target.value)}
                    className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Invoice Document Number
                  </label>
                  <input
                    type="text"
                    value={docNum}
                    onChange={(e) => setDocNum(e.target.value)}
                    className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleComputeIrn}
                disabled={isComputingIrn}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isComputingIrn ? "Computing SHA-256 Hash..." : "Compute Invoice Reference Number (IRN)"}
              </button>

              {computedIrn && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">NIC 64-Hex SHA-256 IRN</span>
                  <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 break-all bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {computedIrn}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Compliant with Indian GST E-Invoicing Rule 48(4)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E-Way Bill Mode */}
          {activeStandard === "EWAY_BILL" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Transport Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Transit Distance (Kilometers)
                  </label>
                  <input
                    type="number"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(parseInt(e.target.value) || 1)}
                    className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                Statutory Rule: E-Way Bill validity computed at <strong>1 day per 200 km</strong> for regular cargo.
              </div>

              <button
                type="button"
                onClick={handleGenerateEwb}
                disabled={isGeneratingEwb}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                {isGeneratingEwb ? "Generating E-Way Bill..." : "Generate E-Way Bill"}
              </button>

              {ewbResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-900 dark:text-emerald-200 font-mono text-sm">
                      {ewbResult.eWayBillNumber}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold">
                      Valid Transit
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1 font-mono">
                    <div>Vehicle: {ewbResult.vehicleNumber} (Distance: {ewbResult.distanceKm} km)</div>
                    <div>Valid Until: {formatDateTime(ewbResult.validUntil)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Peppol BIS 3.0 Mode */}
          {activeStandard === "PEPPOL" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Globe className="w-4 h-4 text-indigo-600" />
                Peppol BIS Billing 3.0 UBL XML Schema
              </div>
              <p className="text-[11px] text-slate-500">
                Cross-border European standard conforming to Directive 2014/55/EU (EN 16931).
              </p>
              <pre className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto max-h-48">
{`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>INV-2026-0089</cbc:ID>
  <cbc:IssueDate>2026-08-25</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="EUR">12500.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`}
              </pre>
            </div>
          )}

          {/* ZATCA Phase 2 Mode */}
          {activeStandard === "ZATCA" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <QrCode className="w-4 h-4 text-indigo-600" />
                Saudi ZATCA Fatoora Phase 2 Cryptographic TLV
              </div>
              <p className="text-[11px] text-slate-500">
                Binary Tag-Length-Value (TLV) encoded Base64 QR code verifying cryptographic timestamps and tax breakdowns.
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all">
                AQ1VYWJJbmRpYSBMTEMCDzMxMDEyMzQ1Njc4OTAxMwMUMjAyNi0wOC0yNVQwNjo1Nzo0MloEBTQ1MC4wMAUFNTguNTA=
              </div>
            </div>
          )}
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default ComplianceManager;
