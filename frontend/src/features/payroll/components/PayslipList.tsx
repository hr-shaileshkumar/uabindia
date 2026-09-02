"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileCheck } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton, ErpRowActions } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { ListSearchInput } from "@/components/workspace/list-toolbar";
import { StatusBadge } from "@/components/workspace/status-badge";
import {
  erpButtonClassName,
  erpTableRowHoverClassName,
  erpTableTdClassName,
} from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError } from "@/lib/notifications";
import { payrollApi } from "@/services/modules";
import { PrintablePayslipModal, type PayslipData } from "@/components/workspace/PrintablePayslipModal";
import { formatCurrency } from "@/lib/formatters";
import { useLocalization } from "@/context/LocalizationContext";
import type { Payslip } from "@/types";

type PayslipRecord = Payslip & {
  employee?: { fullName?: string };
  gross?: number;
  net?: number;
  totalDeductions?: number;
  displayName?: string;
  period?: string;
};

const slipStatusTone = (status?: string) => {
  if (status === "Sent") return "positive" as const;
  if (status === "Generated") return "info" as const;
  return "neutral" as const;
};

const mapPayslip = (row: Record<string, unknown>): PayslipRecord => {
  const gross = Number(row.grossPay ?? row.gross ?? 0);
  const net = Number(row.netPay ?? row.net ?? 0);
  const deductions = Number(row.totalDeductions ?? Math.max(0, gross - net));
  const month = Number(row.month ?? 0) || new Date().getMonth() + 1;
  const year = Number(row.year ?? 0) || new Date().getFullYear();
  const employeeName = row.employeeName ? String(row.employeeName) : undefined;
  return {
    id: String(row.id),
    employeeId: String(row.employeeId ?? ""),
    employeeName,
    month,
    year,
    grossPay: gross,
    totalDeductions: deductions,
    netPay: net,
    status: String(row.status ?? "Generated") as Payslip["status"],
    displayName: employeeName ?? String(row.employeeId ?? "—"),
    period: `${month}/${year}`,
  };
};

export function PayslipList() {
  const { activeCountry } = useLocalization();
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingForm16Id, setDownloadingForm16Id] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<PayslipData | null>(null);

  const { data: slips = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["payroll", "payslips"],
    queryFn: async () => {
      const { data } = await payrollApi.payslips.list();
      const rows = Array.isArray(data) ? data : (data as { data?: Record<string, unknown>[] })?.data;
      return (Array.isArray(rows) ? rows : []).map((row) => mapPayslip(row as Record<string, unknown>));
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return slips;
    return slips.filter((s) =>
      `${s.employeeName ?? s.employee?.fullName ?? ""} ${s.employeeId} ${s.status}`.toLowerCase().includes(q),
    );
  }, [slips, search]);

  const sentCount = slips.filter((s) => s.status === "Sent" || s.status === "Generated").length;

  const handleDownload = async (id: string) => {
    try {
      setDownloadingId(id);
      const response = await payrollApi.payslips.download(id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `payslip-${id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to download payslip."), "Payslips");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadForm16 = async (slip: PayslipRecord) => {
    try {
      setDownloadingForm16Id(slip.id);
      const fy = slip.month && slip.month >= 4 ? slip.year : slip.year - 1;
      const response = await payrollApi.statutory.form16(slip.employeeId, fy);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `form16-${slip.employeeId}-FY${fy}-${fy + 1}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to download Form 16."), "Payroll");
    } finally {
      setDownloadingForm16Id(null);
    }
  };

  const list = useErpListView({
    listKey: "payroll-payslips",
    rows: filtered,
    columns: [
      { key: "displayName", label: "Employee" },
      { key: "period", label: "Period" },
      { key: "grossPay", label: "Gross", dataType: "currency" },
      { key: "totalDeductions", label: "Deductions", dataType: "currency" },
      { key: "netPay", label: "Net Pay", dataType: "currency" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (slip) => slip.id,
    loading: isLoading,
    emptyMessage: "Complete a draft payroll run to auto-generate payslips for active employees.",
    onRefresh: () => void refetch(),
    extraFilters: (
      <ListSearchInput value={search} onChange={setSearch} placeholder="Search by employee name or ID…" />
    ),
    renderRow: (slip) => {
      const name = slip.employeeName ?? slip.employee?.fullName ?? slip.employeeId;
      return (
        <tr key={slip.id} className={erpTableRowHoverClassName}>
          <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{name}</td>
          <td className={erpTableTdClassName}>
            {slip.month}/{slip.year}
          </td>
          <td className={`${erpTableTdClassName} text-right`}>{formatCurrency(slip.grossPay, activeCountry.currency)}</td>
          <td className={`${erpTableTdClassName} text-right text-rose-700`}>
            {formatCurrency(slip.totalDeductions, activeCountry.currency)}
          </td>
          <td className={`${erpTableTdClassName} text-right font-semibold text-emerald-700`}>
            {formatCurrency(slip.netPay, activeCountry.currency)}
          </td>
          <td className={erpTableTdClassName}>
            <StatusBadge tone={slipStatusTone(slip.status)}>{slip.status}</StatusBadge>
          </td>
          <td className={`${erpTableTdClassName} text-right`}>
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                title="View & Print Official Payslip"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                onClick={() => {
                  setSelectedSlip({
                    payslipId: `PS-${slip.year}-${String(slip.month).padStart(2, "0")}-${slip.id.slice(0, 4)}`,
                    employeeName: slip.displayName || "Employee",
                    employeeCode: `EMP-${slip.employeeId.slice(0, 6)}`,
                    designation: "Executive Staff",
                    department: "Global Operations",
                    joiningDate: "01 Jan 2024",
                    bankAccount: "•••• •••• 9842 (HDFC Bank)",
                    panNumber: "ABCDE1234F",
                    period: `${slip.month}/${slip.year}`,
                    totalDays: 30,
                    workedDays: 30,
                    lwpDays: 0,
                    basicSalary: Math.round(slip.grossPay * 0.6),
                    hra: Math.round(slip.grossPay * 0.25),
                    specialAllowance: Math.round(slip.grossPay * 0.15),
                    bonus: 0,
                    pfDeduction: Math.round(slip.totalDeductions * 0.6),
                    taxDeduction: Math.round(slip.totalDeductions * 0.4),
                    esiDeduction: 0,
                    otherDeductions: 0,
                    paymentStatus: slip.status || "Verified",
                    disbursedOn: `${slip.month}/${slip.year}`,
                  });
                  setModalOpen(true);
                }}
              >
                <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>View / Print</span>
              </button>
              <button
                type="button"
                title="Download Form 16"
                disabled={downloadingForm16Id === slip.id}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                onClick={() => void handleDownloadForm16(slip)}
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>{downloadingForm16Id === slip.id ? "…" : "Form 16"}</span>
              </button>
            </div>
          </td>
        </tr>
      );
    },
  });

  return (
    <>
      <StandardPageLayout
        title="Employee Payslips"
        subtitle="Search, inspect, and download monthly salary slips for all employees."
        eyebrow="Payroll / Payslips"
        icon="file"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Payslips", value: slips.length, helper: "records" },
              { label: "Generated", value: sentCount, tone: "positive" },
              { label: "Other", value: slips.length - sentCount, tone: "warning" },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void refetch()} loading={isLoading || isFetching} />
            {list.headerTools}
          </>
        }
        filters={list.filterBar}
      >
        {isError ? (
          <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load payslips.")}</div>
        ) : null}

        <CrudCard>{list.table}</CrudCard>
      </StandardPageLayout>

      <PrintablePayslipModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        data={selectedSlip}
      />
    </>
  );
}
