"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdministrationGlobalPageShell,
} from "@/components/administration/AdministrationGlobalPageShell";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { financeApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatCurrency } from "@/lib/formatters";
import { usePermissions } from "@/context/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";
import {
  AlertCircle,
  Download,
  Plus,
  RefreshCw,
  UploadCloud,
} from "lucide-react";

import {
  currentPeriod,
  formatDate,
  type BankAccountOption,
  type DrawerTab,
  type ParsedBankStatement,
  type ReconciliationForm,
  type ReconciliationRow,
  type ViewTab,
} from "../types/reconciliation.types";
import { SAMPLE_FEEDS } from "../utils/sample-feeds";
import { useReconciliationKpis } from "./ReconciliationKpis";
import { ReconciliationToolbar } from "./ReconciliationToolbar";
import { ReconciliationRegisterTable } from "./ReconciliationRegisterTable";
import { BankFeedsStudio } from "./BankFeedsStudio";
import { TreasuryLedgersTable } from "./TreasuryLedgersTable";
import { ReconciliationInspectDrawer } from "./ReconciliationInspectDrawer";
import { ReconciliationFormDrawer } from "./ReconciliationFormDrawer";

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as { data?: unknown; items?: unknown };
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
}

export function BankReconciliationManager() {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canView = isSuperAdmin || hasPermission([PERMISSIONS.BANK_RECONCILIATION_VIEW]);
  const canCreate = isSuperAdmin || hasPermission([PERMISSIONS.BANK_RECONCILIATION_CREATE]);
  const canEdit = isSuperAdmin || hasPermission([PERMISSIONS.BANK_RECONCILIATION_EDIT]);
  const canDelete = isSuperAdmin || hasPermission([PERMISSIONS.BANK_RECONCILIATION_DELETE]);
  const canExport = isSuperAdmin || hasPermission([PERMISSIONS.BANK_RECONCILIATION_EXPORT]);

  // Primary Data
  const [records, setRecords] = useState<ReconciliationRow[]>([]);
  const [accounts, setAccounts] = useState<BankAccountOption[]>([]);
  const [balanceByAccount, setBalanceByAccount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<ViewTab>("register");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [varianceFilter, setVarianceFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("account");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReconciliationForm>({
    accountId: "",
    bankBalance: 0,
    bookBalance: 0,
    period: currentPeriod(),
    remarks: "",
  });

  // Inspection Drawer
  const [inspectRecord, setInspectRecord] = useState<ReconciliationRow | null>(null);

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<ReconciliationRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Electronic Bank Feed State
  const [feedFormat, setFeedFormat] = useState<"ofx" | "mt940" | "csv">("ofx");
  const [feedCurrency, setFeedCurrency] = useState("INR");
  const [feedContent, setFeedContent] = useState("");
  const [isParsingFeed, setIsParsingFeed] = useState(false);
  const [parsedStatement, setParsedStatement] = useState<ParsedBankStatement | null>(null);

  // Load All Primary Data
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [coaRes, balRes, reconRes] = await Promise.all([
        financeApi.chartOfAccounts.getAll().catch(() => ({ data: [] })),
        financeApi.chartOfAccounts.getBalances().catch(() => ({ data: [] })),
        financeApi.bankReconciliations.getAll(1, 100),
      ]);

      const coaList = asArray<Record<string, unknown>>(coaRes.data);
      const balances = asArray<{ accountId?: string; closingBalance?: number }>(balRes.data);
      const reconList = asArray<Record<string, unknown>>(reconRes.data);

      const balanceMap: Record<string, number> = {};
      for (const row of balances) {
        if (row.accountId) balanceMap[row.accountId] = Number(row.closingBalance ?? 0);
      }
      setBalanceByAccount(balanceMap);

      // Extract Bank & Cash COA Accounts
      const mappedAccounts: BankAccountOption[] = coaList
        .filter((account) => !account.isGroup)
        .map((account) => {
          const accId = String(account.id ?? "");
          return {
            id: accId,
            accountCode: String(account.accountCode ?? ""),
            accountName: String(account.accountName ?? "Unnamed Account"),
            accountType: String(account.accountType ?? "Asset"),
            currentBalance: balanceMap[accId] ?? Number(account.currentBalance ?? 0),
          };
        });
      setAccounts(mappedAccounts);

      // Reconciliations Records
      setRecords(
        reconList.map((row) => ({
          id: String(row.id),
          accountId: row.accountId ? String(row.accountId) : undefined,
          accountCode: String(row.accountCode ?? ""),
          accountName: String(row.accountName ?? ""),
          bankBalance: Number(row.bankBalance ?? 0),
          bookBalance: Number(row.bookBalance ?? 0),
          difference: Number(row.difference ?? 0),
          period: String(row.period ?? ""),
          status: String(row.status ?? "Pending"),
          lastReconciled: row.lastReconciled ? String(row.lastReconciled) : undefined,
          remarks: row.remarks ? String(row.remarks) : undefined,
          createdAt: row.createdAt ? String(row.createdAt) : undefined,
          updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
        }))
      );
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load bank reconciliation data.");
      setError(msg);
      notifyError(msg, "Bank Reconciliation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Handle Account Selection in Form
  const handleAccountSelect = (accId: string) => {
    const selectedAcc = accounts.find((a) => a.id === accId);
    const bookBal = balanceByAccount[accId] ?? selectedAcc?.currentBalance ?? 0;
    setForm((prev) => ({
      ...prev,
      accountId: accId,
      accountCode: selectedAcc?.accountCode,
      accountName: selectedAcc?.accountName,
      bookBalance: bookBal,
    }));
  };

  // Open Create Drawer
  const handleOpenCreate = (prefillAccountId?: string, prefillBankBalance?: number) => {
    const initialAccId = prefillAccountId || (accounts.length > 0 ? accounts[0].id : "");
    const initialAcc = accounts.find((a) => a.id === initialAccId);
    const bookBal = initialAccId ? (balanceByAccount[initialAccId] ?? initialAcc?.currentBalance ?? 0) : 0;

    setEditingId(null);
    setForm({
      accountId: initialAccId,
      accountCode: initialAcc?.accountCode,
      accountName: initialAcc?.accountName,
      bankBalance: prefillBankBalance !== undefined ? prefillBankBalance : bookBal,
      bookBalance: bookBal,
      period: currentPeriod(),
      status: "Matched",
      remarks: prefillBankBalance !== undefined ? "Imported via Electronic Bank Feed Studio" : "",
    });
    setDrawerTab("account");
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (record: ReconciliationRow) => {
    setEditingId(record.id);
    setForm({
      id: record.id,
      accountId: record.accountId || "",
      accountCode: record.accountCode,
      accountName: record.accountName,
      bankBalance: record.bankBalance ?? 0,
      bookBalance: record.bookBalance ?? 0,
      period: record.period || currentPeriod(),
      status: record.status || "Matched",
      remarks: record.remarks || "",
    });
    setDrawerTab("account");
    setIsDrawerOpen(true);
    setInspectRecord(null);
  };

  // Save Reconciliation (Create or Update)
  const handleSaveReconciliation = async () => {
    if (!form.accountId) {
      notifyError("Please select a valid bank account to reconcile.", "Validation Error");
      setDrawerTab("account");
      return;
    }

    const bankBal = Number(form.bankBalance) || 0;
    const bookBal = Number(form.bookBalance) || 0;
    const diff = bankBal - bookBal;

    let computedStatus = form.status;
    if (!computedStatus || computedStatus === "Auto") {
      computedStatus = Math.abs(diff) < 1 ? "Matched" : Math.abs(diff) < 1000 ? "Partial" : "Unmatched";
    }

    try {
      setSaving(true);
      if (editingId) {
        await financeApi.bankReconciliations.update(editingId, {
          accountId: form.accountId,
          bankBalance: bankBal,
          bookBalance: bookBal,
          period: form.period,
          status: computedStatus,
          remarks: form.remarks,
        });
        notifySuccess("Bank reconciliation record updated successfully.");
      } else {
        await financeApi.bankReconciliations.create({
          accountId: form.accountId,
          bankBalance: bankBal,
          bookBalance: bookBal,
          period: form.period,
          status: computedStatus,
          remarks: form.remarks,
        });
        notifySuccess("New bank reconciliation record recorded successfully.");
      }
      setIsDrawerOpen(false);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save bank reconciliation."), "Reconciliation");
    } finally {
      setSaving(false);
    }
  };

  // Execute Soft Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await financeApi.bankReconciliations.delete(deleteTarget.id);
      notifySuccess(`Reconciliation for ${deleteTarget.accountName || "account"} deleted.`);
      setDeleteTarget(null);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete reconciliation record."), "Delete Reconciliation");
    } finally {
      setDeleting(false);
    }
  };

  // Electronic Bank Feed Parser Handler
  const handleParseBankFeed = async () => {
    if (!feedContent.trim()) {
      notifyError("Please paste or load statement content before parsing.", "Bank Feed Parser");
      return;
    }

    setIsParsingFeed(true);
    try {
      let res;
      if (feedFormat === "ofx") {
        res = await financeApi.bankFeeds.parseOfx(feedContent, feedCurrency);
      } else if (feedFormat === "mt940") {
        res = await financeApi.bankFeeds.parseMt940(feedContent, feedCurrency);
      } else {
        res = await financeApi.bankFeeds.parseCsv(feedContent, feedCurrency);
      }

      const stmt = res.data?.data as ParsedBankStatement;
      if (stmt) {
        setParsedStatement(stmt);
        notifySuccess(
          `Statement parsed: ${stmt.transactions?.length || 0} transactions extracted with closing balance ${formatCurrency(
            stmt.closingBalance,
            stmt.currency || feedCurrency
          )}.`
        );
      } else {
        notifyError("Parser returned an empty statement response.", "Bank Feed Parser");
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to parse bank feed statement."), "Bank Feed Ingestion");
    } finally {
      setIsParsingFeed(false);
    }
  };

  // Load Preset Sample Data into Feed Studio
  const handleLoadSampleFeed = (format: "ofx" | "mt940" | "csv") => {
    setFeedFormat(format);
    setFeedContent(SAMPLE_FEEDS[format]);
    setFeedCurrency("INR");
    notifySuccess(`Loaded demo ${format.toUpperCase()} bank feed statement.`);
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q ||
        (r.accountName && r.accountName.toLowerCase().includes(q)) ||
        (r.accountCode && r.accountCode.toLowerCase().includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q)) ||
        (r.period && r.period.toLowerCase().includes(q));

      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchPeriod = !periodFilter || (r.period && r.period.startsWith(periodFilter));

      let matchVariance = true;
      if (varianceFilter === "zero") {
        matchVariance = Math.abs(r.difference || 0) < 0.01;
      } else if (varianceFilter === "gap") {
        matchVariance = Math.abs(r.difference || 0) >= 0.01;
      }

      return matchSearch && matchStatus && matchPeriod && matchVariance;
    });
  }, [records, search, statusFilter, varianceFilter, periodFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // KPI Metrics
  const kpiMetrics = useReconciliationKpis(records);

  // CSV Export Handler
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      notifyError("No reconciliation records to export.", "CSV Export");
      return;
    }

    const headers = [
      "Account Code",
      "Account Name",
      "Fiscal Period",
      "Bank Balance",
      "Book Balance",
      "Difference",
      "Status",
      "Last Reconciled",
      "Remarks",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.accountCode || ""}"`,
      `"${(r.accountName || "").replace(/"/g, '""')}"`,
      `"${r.period || ""}"`,
      r.bankBalance ?? 0,
      r.bookBalance ?? 0,
      r.difference ?? 0,
      `"${r.status || ""}"`,
      `"${r.lastReconciled ? formatDate(r.lastReconciled) : ""}"`,
      `"${(r.remarks || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bank_reconciliations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess(`Exported ${filteredRecords.length} records to CSV.`);
  };

  // Calculated Difference in Form Drawer
  const liveFormDifference = useMemo(() => {
    const bank = Number(form.bankBalance) || 0;
    const book = Number(form.bookBalance) || 0;
    return bank - book;
  }, [form.bankBalance, form.bookBalance]);

  const hasFilters = Boolean(search || statusFilter || varianceFilter || periodFilter);

  return (
    <AdministrationGlobalPageShell
      title="Bank Reconciliation & Electronic Statement Feeds"
      subtitle="Reconcile treasury bank accounts against general ledger balances, track statement variances, and ingest electronic OFX, MT940, and CSV feeds."
      categoryTag="Finance & Treasury"
      kpiMetrics={kpiMetrics}
      primaryActionLabel={canCreate ? "New Reconciliation" : undefined}
      primaryActionIcon={<Plus className="w-4 h-4" />}
      onPrimaryAction={() => handleOpenCreate()}
      secondaryActions={[
        {
          label: "Electronic Feed Studio",
          icon: <UploadCloud className="w-4 h-4" />,
          onClick: () => setActiveTab("feeds"),
        },
        {
          label: "Export CSV",
          icon: <Download className="w-4 h-4" />,
          onClick: handleExportCsv,
          disabled: !canExport || filteredRecords.length === 0,
        },
        {
          label: "Refresh",
          icon: <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />,
          onClick: () => void load(),
        },
      ]}
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main View Tab Switcher */}
      <ReconciliationToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recordsCount={records.length}
        accountsCount={accounts.length}
        filteredCount={filteredRecords.length}
      />

      {/* VIEW TAB 1: RECONCILIATION REGISTER */}
      {activeTab === "register" && (
        <ReconciliationRegisterTable
          records={paginatedRecords}
          totalFilteredCount={filteredRecords.length}
          loading={loading}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
          varianceFilter={varianceFilter}
          onVarianceFilterChange={(val) => {
            setVarianceFilter(val);
            setCurrentPage(1);
          }}
          periodFilter={periodFilter}
          onPeriodFilterChange={(val) => {
            setPeriodFilter(val);
            setCurrentPage(1);
          }}
          onClearFilters={() => {
            setSearch("");
            setStatusFilter("");
            setVarianceFilter("");
            setPeriodFilter("");
            setCurrentPage(1);
          }}
          hasFilters={hasFilters}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onOpenCreate={() => handleOpenCreate()}
          onInspect={(r) => setInspectRecord(r)}
          onEdit={(r) => handleOpenEdit(r)}
          onDelete={(r) => setDeleteTarget(r)}
        />
      )}

      {/* VIEW TAB 2: ELECTRONIC BANK FEED STUDIO */}
      {activeTab === "feeds" && (
        <BankFeedsStudio
          feedFormat={feedFormat}
          onFeedFormatChange={setFeedFormat}
          feedCurrency={feedCurrency}
          onFeedCurrencyChange={setFeedCurrency}
          feedContent={feedContent}
          onFeedContentChange={setFeedContent}
          isParsingFeed={isParsingFeed}
          onParseFeed={handleParseBankFeed}
          onLoadSample={handleLoadSampleFeed}
          parsedStatement={parsedStatement}
          onCreateFromFeed={(closingBal) => handleOpenCreate(undefined, closingBal)}
        />
      )}

      {/* VIEW TAB 3: TREASURY GL LEDGERS */}
      {activeTab === "treasury" && (
        <TreasuryLedgersTable
          accounts={accounts}
          onReconcileAccount={(accId) => handleOpenCreate(accId)}
        />
      )}

      {/* INSPECTION DRAWER */}
      <ReconciliationInspectDrawer
        record={inspectRecord}
        onClose={() => setInspectRecord(null)}
        canEdit={canEdit}
        onEdit={(r) => handleOpenEdit(r)}
      />

      {/* FORM DRAWER (CREATE / EDIT) */}
      <ReconciliationFormDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        editingId={editingId}
        form={form}
        onFormChange={setForm}
        accounts={accounts}
        onAccountSelect={handleAccountSelect}
        drawerTab={drawerTab}
        onDrawerTabChange={setDrawerTab}
        liveFormDifference={liveFormDifference}
        onSave={handleSaveReconciliation}
        saving={saving}
      />

      {/* UNIVERSAL DELETE CONFIRMATION DIALOG */}
      <UniversalDeleteDialog
        open={!!deleteTarget}
        title="Delete Bank Reconciliation"
        entityName={deleteTarget ? `${deleteTarget.accountName || "Bank"} (${deleteTarget.period})` : "Statement"}
        onConfirm={handleConfirmDelete}
        onOpenChange={(val) => {
          if (!val) setDeleteTarget(null);
        }}
        loading={deleting}
      />
    </AdministrationGlobalPageShell>
  );
}

export default BankReconciliationManager;
