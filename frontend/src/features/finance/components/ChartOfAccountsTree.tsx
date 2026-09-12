"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Download,
  Folder,
  FolderOpen,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  Copy,
  Check,
  Table as TableIcon,
  GitFork,
  ArrowUpDown,
  Coins,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
} from "@/components/administration/AdministrationGlobalPageShell";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { usePermissions } from "@/context/PermissionContext";
import { financeApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

export interface CoaAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  subType: string;
  parentAccountId?: string | null;
  description?: string | null;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  isGroup: boolean;
  isActive: boolean;
  level: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoaTreeNode extends CoaAccount {
  children?: CoaTreeNode[];
}

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"] as const;

const COMMON_SUBTYPES: Record<string, string[]> = {
  Asset: [
    "Cash & Cash Equivalents",
    "Bank Accounts",
    "Trade Receivables",
    "Inventories",
    "Short-term Loans & Advances",
    "Property, Plant & Equipment",
    "Intangible Assets",
    "Long-term Investments",
    "Deferred Tax Assets",
  ],
  Liability: [
    "Trade Payables",
    "Short-term Borrowings",
    "Statutory Dues & Taxes",
    "Other Current Liabilities",
    "Long-term Borrowings",
    "Deferred Tax Liabilities",
    "Provisions",
  ],
  Equity: [
    "Equity Share Capital",
    "Preference Share Capital",
    "Reserves & Surplus",
    "Retained Earnings",
    "Partners / Proprietor Capital",
  ],
  Revenue: [
    "Operating Revenue / Sales",
    "Service Revenue",
    "Export Sales",
    "Other Operating Revenue",
    "Interest & Dividend Income",
    "Foreign Exchange Gain",
  ],
  Expense: [
    "Cost of Materials Consumed",
    "Purchase of Stock-in-Trade",
    "Employee Benefit Expenses",
    "Finance & Bank Charges",
    "Depreciation & Amortization",
    "Administrative & General Expenses",
    "Selling & Distribution Expenses",
    "Current Tax Expense",
  ],
};

function buildTree(flat: CoaAccount[]): CoaTreeNode[] {
  const map = new Map<string, CoaTreeNode>();
  flat.forEach((record) => {
    map.set(record.id, {
      ...record,
      children: [],
    });
  });

  const roots: CoaTreeNode[] = [];
  flat.forEach((record) => {
    const node = map.get(record.id);
    if (!node) return;

    if (record.parentAccountId && map.has(record.parentAccountId)) {
      map.get(record.parentAccountId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: CoaTreeNode[]) => {
    nodes.sort((a, b) => a.accountCode.localeCompare(b.accountCode, undefined, { numeric: true }));
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) {
        sortNodes(n.children);
      }
    });
  };

  sortNodes(roots);
  return roots;
}

function typeBadgeStyles(type: string) {
  switch (type) {
    case "Asset":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Liability":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Equity":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Revenue":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Expense":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function ChartOfAccountsTree() {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManage = isSuperAdmin || hasPermission(["chartofaccounts.manage", "finance.admin", "chartofaccounts.edit"]);

  const [accounts, setAccounts] = useState<CoaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [structureFilter, setStructureFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"tree" | "register">("tree");

  // Expanded nodes map
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "create" | "edit">("create");
  const [activeTab, setActiveTab] = useState<"classification" | "hierarchy">("classification");
  const [selectedAccount, setSelectedAccount] = useState<CoaAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Seed standard modal
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState("IND_AS");
  const [seeding, setSeeding] = useState(false);

  // Delete dialog
  const [deleteAccount, setDeleteAccount] = useState<CoaAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick-copy tooltip
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    accountCode: "",
    accountName: "",
    accountType: "Asset",
    subType: "",
    parentAccountId: "",
    description: "",
    isGroup: false,
    openingBalance: 0,
    currency: "INR",
    isActive: true,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.chartOfAccounts.getAll();
      const list: CoaAccount[] = Array.isArray(res.data) ? res.data : [];
      setAccounts(list);

      // Auto expand first 2 levels by default
      const initialExpanded: Record<string, boolean> = {};
      list.forEach((item) => {
        if (item.level <= 2 || item.isGroup) {
          initialExpanded[item.id] = true;
        }
      });
      setExpandedNodes(initialExpanded);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load chart of accounts.");
      setError(message);
      notifyError(message, "Finance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Group accounts available as parents
  const availableParentAccounts = useMemo(() => {
    return accounts.filter((a) => a.isGroup && a.id !== selectedAccount?.id);
  }, [accounts, selectedAccount]);

  // KPIs
  const totalAccountsCount = accounts.length;
  const ledgerAccountsCount = useMemo(() => accounts.filter((a) => !a.isGroup).length, [accounts]);

  const totalAssetsBalance = useMemo(() => {
    return accounts
      .filter((a) => !a.isGroup && a.accountType === "Asset")
      .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  }, [accounts]);

  const totalLiabilitiesAndEquity = useMemo(() => {
    return accounts
      .filter((a) => !a.isGroup && (a.accountType === "Liability" || a.accountType === "Equity"))
      .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  }, [accounts]);

  const netPlPosition = useMemo(() => {
    const revenue = accounts
      .filter((a) => !a.isGroup && a.accountType === "Revenue")
      .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    const expense = accounts
      .filter((a) => !a.isGroup && a.accountType === "Expense")
      .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    return revenue - expense;
  }, [accounts]);

  const kpis: KpiMetricItem[] = [
    {
      label: "General Ledger Accounts",
      value: `${ledgerAccountsCount} Ledgers`,
      tone: "info",
      subtext: `${totalAccountsCount} total accounts (${totalAccountsCount - ledgerAccountsCount} groups)`,
    },
    {
      label: "Balance Sheet Assets",
      value: `₹${totalAssetsBalance.toLocaleString("en-IN")}`,
      tone: "positive",
      subtext: "Total capitalized & current assets",
    },
    {
      label: "Liabilities & Equity",
      value: `₹${totalLiabilitiesAndEquity.toLocaleString("en-IN")}`,
      tone: "warning",
      subtext: "Capital reserves & debt obligations",
    },
    {
      label: "P&L Net Position",
      value: `₹${netPlPosition.toLocaleString("en-IN")}`,
      tone: netPlPosition >= 0 ? "positive" : "negative",
      subtext: netPlPosition >= 0 ? "Operating surplus / profit" : "Operating deficit / loss",
    },
  ];

  // Filtering
  const filteredAccounts = useMemo(() => {
    return accounts.filter((item) => {
      if (typeFilter !== "ALL" && item.accountType !== typeFilter) return false;
      if (structureFilter === "group" && !item.isGroup) return false;
      if (structureFilter === "ledger" && item.isGroup) return false;
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const codeMatch = item.accountCode?.toLowerCase().includes(term);
        const nameMatch = item.accountName?.toLowerCase().includes(term);
        const subTypeMatch = item.subType?.toLowerCase().includes(term);
        const descMatch = item.description?.toLowerCase().includes(term);
        return codeMatch || nameMatch || subTypeMatch || descMatch;
      }
      return true;
    });
  }, [accounts, typeFilter, structureFilter, statusFilter, searchTerm]);

  // Tree nodes
  const treeRoots = useMemo(() => {
    return buildTree(filteredAccounts);
  }, [filteredAccounts]);

  // Expand / Collapse all
  const handleExpandAll = () => {
    const allExp: Record<string, boolean> = {};
    accounts.forEach((a) => {
      allExp[a.id] = true;
    });
    setExpandedNodes(allExp);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy code
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Open Create Drawer
  const handleOpenCreate = (parentAccountId?: string) => {
    setSelectedAccount(null);
    setFormData({
      accountCode: "",
      accountName: "",
      accountType: "Asset",
      subType: "",
      parentAccountId: parentAccountId || "",
      description: "",
      isGroup: false,
      openingBalance: 0,
      currency: "INR",
      isActive: true,
    });
    setActiveTab("classification");
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (account: CoaAccount) => {
    setSelectedAccount(account);
    setFormData({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      subType: account.subType || "",
      parentAccountId: account.parentAccountId || "",
      description: account.description || "",
      isGroup: account.isGroup,
      openingBalance: account.openingBalance || 0,
      currency: account.currency || "INR",
      isActive: account.isActive,
    });
    setActiveTab("classification");
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  // Open View Drawer
  const handleOpenView = (account: CoaAccount) => {
    setSelectedAccount(account);
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.accountCode.trim()) {
      notifyError("Account Code is required.", "Validation");
      return;
    }
    if (!formData.accountName.trim()) {
      notifyError("Account Name is required.", "Validation");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        accountCode: formData.accountCode.trim().toUpperCase(),
        accountName: formData.accountName.trim(),
        accountType: formData.accountType,
        subType: formData.subType.trim(),
        parentAccountId: formData.parentAccountId || null,
        description: formData.description.trim() || null,
        isGroup: formData.isGroup,
        openingBalance: Number(formData.openingBalance) || 0,
        currency: formData.currency,
        isActive: formData.isActive,
      };

      if (drawerMode === "edit" && selectedAccount) {
        await financeApi.chartOfAccounts.update(selectedAccount.id, payload);
        notifySuccess(`Account '${payload.accountCode}' updated successfully.`, "Chart of Accounts");
      } else {
        await financeApi.chartOfAccounts.create(payload);
        notifySuccess(`Account '${payload.accountCode}' created successfully.`, "Chart of Accounts");
      }

      setIsDrawerOpen(false);
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to save chart of account.");
      notifyError(msg, "Chart of Accounts");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteAccount) return;
    try {
      setDeleting(true);
      await financeApi.chartOfAccounts.delete(deleteAccount.id);
      notifySuccess(`Account '${deleteAccount.accountCode}' deleted successfully.`, "Chart of Accounts");
      setDeleteAccount(null);
      if (selectedAccount?.id === deleteAccount.id) {
        setIsDrawerOpen(false);
      }
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to delete account.");
      notifyError(msg, "Chart of Accounts");
    } finally {
      setDeleting(false);
    }
  };

  // Seed standard template
  const handleSeedStandard = async () => {
    try {
      setSeeding(true);
      const res = await financeApi.chartOfAccounts.seedStandard(selectedStandard);
      notifySuccess(
        res.data?.message || `Seeded standard chart of accounts successfully.`,
        "Chart of Accounts"
      );
      setIsSeedModalOpen(false);
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to seed standard chart of accounts.");
      notifyError(msg, "Chart of Accounts");
    } finally {
      setSeeding(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (accounts.length === 0) {
      notifyError("No accounts to export.", "Export");
      return;
    }

    const headers = [
      "Account Code",
      "Account Name",
      "Account Type",
      "Sub-Type",
      "Classification",
      "Parent Account ID",
      "Hierarchy Level",
      "Current Balance (INR)",
      "Status",
    ];

    const rows = filteredAccounts.map((a) => [
      `"${a.accountCode}"`,
      `"${a.accountName.replace(/"/g, '""')}"`,
      `"${a.accountType}"`,
      `"${(a.subType || "").replace(/"/g, '""')}"`,
      `"${a.isGroup ? "Group" : "Ledger"}"`,
      `"${a.parentAccountId || ""}"`,
      a.level,
      a.currentBalance ?? 0,
      a.isActive ? "Active" : "Inactive",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Chart_of_Accounts_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess("Chart of Accounts exported successfully.", "CSV Export");
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: CoaTreeNode, depth = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedNodes[node.id]);

    return (
      <div key={node.id} className="relative group">
        <div
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all ${
            node.isGroup
              ? "bg-slate-50/80 border-slate-200/90 hover:bg-slate-100/90 font-medium"
              : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          {/* Left info: Caret, Icon, Code, Name, Badges */}
          <div className="flex min-w-0 items-center gap-2.5">
            {node.isGroup ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            {node.isGroup ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-indigo-600" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-indigo-500" />
              )
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            )}

            {/* Monospace Code Pill */}
            <button
              type="button"
              onClick={(e) => handleCopyCode(node.accountCode, e)}
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
              title="Click to copy account code"
            >
              {node.accountCode}
              {copiedCode === node.accountCode ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-2.5 w-2.5 text-slate-400 opacity-60 group-hover:opacity-100" />
              )}
            </button>

            {/* Account Name */}
            <span
              onClick={() => handleOpenView(node)}
              className="truncate cursor-pointer text-sm font-medium text-slate-900 hover:text-indigo-600 transition"
            >
              {node.accountName}
            </span>

            {/* SubType Pill if present */}
            {node.subType ? (
              <span className="hidden sm:inline-flex items-center text-[11px] font-normal px-2 py-0.5 rounded bg-slate-100/70 text-slate-600">
                {node.subType}
              </span>
            ) : null}

            {/* Inactive chip */}
            {!node.isActive ? (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                Inactive
              </span>
            ) : null}
          </div>

          {/* Right info: Type Badge, Balance, Action Buttons */}
          <div className="flex shrink-0 items-center gap-3">
            {/* Account Type Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${typeBadgeStyles(
                node.accountType
              )}`}
            >
              {node.accountType}
            </span>

            {/* Live Balance */}
            <span className="w-32 text-right font-mono text-sm font-semibold text-slate-900">
              ₹{(node.currentBalance || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
              {node.isGroup ? (
                <button
                  type="button"
                  onClick={() => handleOpenCreate(node.id)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                  title="Add Sub-Account under this group"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => handleOpenView(node)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                title="View account details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              {canManage ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(node)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Edit account"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteAccount(node)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    title="Delete account"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Children nodes recursive */}
        {hasChildren && isExpanded ? (
          <div className="space-y-1 mt-1 pl-2 border-l border-slate-200 ml-4">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Chart of Accounts"
        subtitle="General ledger hierarchy, statutory Ind AS/IFRS classification, and live financial balance registers."
        categoryTag="Finance & Accounts / Master Setup"
        icon="book"
        kpiMetrics={kpis}
        onRefresh={() => void load()}
        onExportCsv={handleExportCsv}
        primaryActionLabel={canManage ? "Add Account" : undefined}
        onPrimaryAction={canManage ? () => handleOpenCreate() : undefined}
        secondaryActions={[
          {
            label: "Seed Standard (Ind AS)",
            onClick: () => setIsSeedModalOpen(true),
            icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
          },
        ]}
      >
        {/* Error state */}
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load chart of accounts</p>
              <p className="text-xs mt-0.5 text-rose-600">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="text-xs font-semibold text-rose-700 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Filter and View Controls */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Instant search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by account code, name, or sub-type..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start md:self-auto shrink-0 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  viewMode === "tree"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <GitFork className="h-3.5 w-3.5" />
                Hierarchy Tree
              </button>
              <button
                type="button"
                onClick={() => setViewMode("register")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  viewMode === "register"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Flat Register
              </button>
            </div>
          </div>

          {/* Second row: Dropdown filters & Tree expand toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type selector */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Account Types</option>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Structure selector */}
              <select
                value={structureFilter}
                onChange={(e) => setStructureFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Structures</option>
                <option value="group">Groups Only</option>
                <option value="ledger">Ledgers Only</option>
              </select>

              {/* Status selector */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Reset filters */}
              {searchTerm || typeFilter !== "ALL" || structureFilter !== "ALL" || statusFilter !== "ALL" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("ALL");
                    setStructureFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 dark:text-indigo-400"
                >
                  Reset Filters
                </button>
              ) : null}
            </div>

            {/* Tree expand / collapse actions */}
            {viewMode === "tree" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition dark:bg-slate-800 dark:text-slate-300"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition dark:bg-slate-800 dark:text-slate-300"
                >
                  Collapse All
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredAccounts.length} of {accounts.length} accounts
              </span>
            )}
          </div>
        </div>

        {/* Main View Area */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-950/50 dark:text-indigo-400">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No chart of accounts found</h3>
              <p className="max-w-md mx-auto mt-1 text-sm text-slate-500 dark:text-slate-400">
                {accounts.length === 0
                  ? "Your general ledger is currently empty. You can quickly seed standard Ind AS MCA Schedule III accounts or create your custom accounts."
                  : "No accounts match your search and filter criteria. Try adjusting or clearing your filters."}
              </p>
              {accounts.length === 0 ? (
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSeedModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    Seed Standard Ind AS Hierarchy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreate()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Account
                  </button>
                </div>
              ) : null}
            </div>
          ) : viewMode === "tree" ? (
            /* Tree View */
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <span>Account Hierarchy</span>
                <div className="flex items-center gap-12 pr-12">
                  <span>Type</span>
                  <span>Live Balance (INR)</span>
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                {treeRoots.map((root) => renderTreeNode(root, 0))}
              </div>
            </div>
          ) : (
            /* Register Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/60">
                    <th className="py-3.5 pl-6 pr-3">Code</th>
                    <th className="px-3 py-3.5">Account Name</th>
                    <th className="px-3 py-3.5">Type & Sub-Type</th>
                    <th className="px-3 py-3.5">Structure</th>
                    <th className="px-3 py-3.5 text-right">Current Balance</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50/70 transition dark:hover:bg-slate-800/50">
                      <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(account.accountCode, e)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {account.accountCode}
                          {copiedCode === account.accountCode ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-2.5 w-2.5 text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {account.isGroup ? (
                            <Folder className="h-4 w-4 text-indigo-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            onClick={() => handleOpenView(account)}
                            className="cursor-pointer hover:text-indigo-600 transition dark:hover:text-indigo-400"
                          >
                            {account.accountName}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${typeBadgeStyles(
                              account.accountType
                            )}`}
                          >
                            {account.accountType}
                          </span>
                          {account.subType ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400">· {account.subType}</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {account.isGroup ? (
                          <span className="inline-flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded dark:bg-indigo-950/60 dark:text-indigo-300">
                            <Layers className="h-3 w-3" /> Group (L{account.level})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-800 dark:text-slate-300">
                            Ledger (L{account.level})
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-right font-mono font-semibold text-slate-900 dark:text-white">
                        ₹{(account.currentBalance || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {account.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            <XCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3 pl-3 pr-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenView(account)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            title="Inspect details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManage ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(account)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                title="Edit account"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteAccount(account)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                title="Delete account"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdministrationGlobalPageShell>

      {/* Slide-over Inspector & Form Drawer */}
      <SideDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          drawerMode === "view"
            ? selectedAccount?.accountName || "Account Details"
            : drawerMode === "edit"
            ? `Edit Account: ${selectedAccount?.accountCode}`
            : "Create General Ledger Account"
        }
        subtitle={
          drawerMode === "view"
            ? `Regulatory classification, live balance, and hierarchy depth.`
            : "Configure general ledger code, statutory category, hierarchy group, and opening balances."
        }
        width="lg"
        footer={
          drawerMode === "view" ? (
            <div className="flex items-center justify-end gap-2 w-full p-4 border-t border-slate-200 dark:border-slate-800">
              {canManage && selectedAccount ? (
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedAccount)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Account
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          ) : (
            <ErpDrawerFooter
              onCancel={() => setIsDrawerOpen(false)}
              onSave={() => void handleSubmit()}
              saving={submitting}
              isEdit={drawerMode === "edit"}
              saveLabel={drawerMode === "edit" ? "Save Changes" : "Create Account"}
            />
          )
        }
      >
        {drawerMode === "view" && selectedAccount ? (
          /* View Mode Inspector */
          <div className="space-y-6 p-4">
            {/* Header summary card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {selectedAccount.accountCode}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${typeBadgeStyles(
                    selectedAccount.accountType
                  )}`}
                >
                  {selectedAccount.accountType}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedAccount.accountName}</h3>
                {selectedAccount.subType ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedAccount.subType}</p>
                ) : null}
              </div>
            </div>

            {/* Financial position card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Balance</p>
                <p className="text-lg font-mono font-bold text-slate-900 mt-1 dark:text-white">
                  ₹{(selectedAccount.currentBalance || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Live real-time position</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Opening Balance</p>
                <p className="text-lg font-mono font-bold text-slate-700 mt-1 dark:text-slate-300">
                  ₹{(selectedAccount.openingBalance || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">At financial year start</p>
              </div>
            </div>

            {/* Account Details Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 text-xs dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Structure Type:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAccount.isGroup ? "Group Account (Parent Folder)" : "Postable Ledger"}
                </span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Hierarchy Level:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Level {selectedAccount.level}</span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Parent Account:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAccount.parentAccountId
                    ? accounts.find((a) => a.id === selectedAccount.parentAccountId)?.accountName ||
                      selectedAccount.parentAccountId
                    : "Top Level (Root)"}
                </span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Currency:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAccount.currency || "INR"}</span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Account Status:</span>
                <span
                  className={`font-semibold ${
                    selectedAccount.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {selectedAccount.isActive ? "Active (Postable)" : "Inactive (Frozen)"}
                </span>
              </div>
            </div>

            {/* Description / Notes */}
            {selectedAccount.description ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description & Statutory Notes</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{selectedAccount.description}</p>
              </div>
            ) : null}
          </div>
        ) : (
          /* Create / Edit Form */
          <div className="space-y-5 p-4">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("classification")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${
                  activeTab === "classification"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                1. Basic & Classification
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hierarchy")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${
                  activeTab === "hierarchy"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                2. Hierarchy & Balances
              </button>
            </div>

            {activeTab === "classification" ? (
              <div className="space-y-4">
                {/* Account Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountCode}
                    onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                    placeholder="e.g. 1100, 2110, 4001"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Unique numerical or alphanumeric general ledger identifier.
                  </p>
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="e.g. Current Assets, HDFC Bank Current A/C, Trade Receivables"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {ACCOUNT_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            accountType: t,
                            subType: COMMON_SUBTYPES[t]?.[0] || "",
                          });
                        }}
                        className={`py-2 text-xs font-semibold rounded-lg border text-center transition ${
                          formData.accountType === t
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/20 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SubType */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sub-Type Classification
                  </label>
                  <select
                    value={formData.subType}
                    onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select or type sub-classification...</option>
                    {(COMMON_SUBTYPES[formData.accountType] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group vs Ledger toggle */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Is Group Account (Parent Folder)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Group accounts organize sub-ledgers and cannot receive direct transaction vouchers.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isGroup}
                      onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Parent Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Group Account
                  </label>
                  <select
                    value={formData.parentAccountId}
                    onChange={(e) => setFormData({ ...formData, parentAccountId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">None (Top-Level Root Account)</option>
                    {availableParentAccounts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.accountCode} - {p.accountName} ({p.accountType})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nests this account inside an existing Group node.
                  </p>
                </div>

                {/* Opening Balance */}
                {!formData.isGroup ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Opening Balance (INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.openingBalance}
                        onChange={(e) =>
                          setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statutory Description & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide accounting notes, statutory disclosure mapping, or usage guidelines..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Active Toggle */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Account Active</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Active accounts are available for ledger postings and journal vouchers.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Standard Seed Modal */}
      {isSeedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Seed Standard Chart of Accounts</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-populate full regulatory general ledger structures.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Select Standard Framework</label>
              <div className="space-y-2">
                {[
                  {
                    code: "IND_AS",
                    title: "India Ind AS (MCA Schedule III)",
                    desc: "Statutory 4-digit hierarchy compliant with Indian Ministry of Corporate Affairs.",
                  },
                  {
                    code: "IFRS",
                    title: "International IFRS Standard",
                    desc: "Global 4-digit hierarchy compliant with IASB / IFRS standards.",
                  },
                  {
                    code: "US_GAAP",
                    title: "US GAAP Standard",
                    desc: "5-digit commercial hierarchy conforming to FASB / US GAAP accounting.",
                  },
                  {
                    code: "UK_GAAP",
                    title: "UK GAAP (FRS 102)",
                    desc: "UK Financial Reporting Standard 102 balance sheet and profit & loss layout.",
                  },
                ].map((item) => (
                  <div
                    key={item.code}
                    onClick={() => setSelectedStandard(item.code)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      selectedStandard === item.code
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:bg-indigo-950/30"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</span>
                      {selectedStandard === item.code ? (
                        <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSeedModalOpen(false)}
                disabled={seeding}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSeedStandard}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition disabled:opacity-60"
              >
                {seeding ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Seeding Accounts...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Seed Hierarchy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Universal Delete Dialog */}
      <UniversalDeleteDialog
        open={Boolean(deleteAccount)}
        onOpenChange={(open) => {
          if (!open) setDeleteAccount(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete General Ledger Account"
        entityName={deleteAccount ? `${deleteAccount.accountCode} - ${deleteAccount.accountName}` : ""}
        loading={deleting}
      />
    </>
  );
}
