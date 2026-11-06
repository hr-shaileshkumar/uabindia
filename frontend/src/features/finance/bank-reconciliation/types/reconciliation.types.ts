import { formatDateTime } from "@/lib/formatters";

export type ReconciliationRow = {
  id: string;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  accountType?: string;
  closingBalance?: number;
  bankBalance?: number;
  bookBalance?: number;
  difference?: number;
  period?: string;
  status?: string; // "Matched" | "Partial" | "Unmatched" | "Pending"
  lastReconciled?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BankAccountOption = {
  id: string;
  accountCode: string;
  accountName: string;
  accountType?: string;
  currentBalance?: number;
  isGroup?: boolean;
};

export type ParsedBankTransaction = {
  transactionDate: string;
  amount: number;
  transactionType: "Credit" | "Debit";
  referenceNumber: string;
  description: string;
  payeePayer?: string;
};

export type ParsedBankStatement = {
  accountNumber: string;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  statementDate: string;
  transactions: ParsedBankTransaction[];
};

export type ReconciliationForm = {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  bankBalance: number | string;
  bookBalance: number | string;
  period: string; // yyyy-MM
  status?: string;
  remarks: string;
};

export type ViewTab = "register" | "feeds" | "treasury";
export type DrawerTab = "account" | "balances" | "adjustments";

export const STATUS_CONFIG: Record<
  string,
  { chip: string; dot: string; label: string }
> = {
  Matched: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
    label: "Zero-Delta Matched",
  },
  Partial: {
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/60",
    dot: "bg-amber-500",
    label: "Partial Match",
  },
  Unmatched: {
    chip: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/60",
    dot: "bg-rose-500",
    label: "Discrepancy / Unmatched",
  },
  Pending: {
    chip: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
    label: "Pending Review",
  },
};

export const currentPeriod = () => new Date().toISOString().slice(0, 7);

export const formatDate = (val: string | Date | undefined) =>
  val ? formatDateTime(val, "en-US", { year: "numeric", month: "short", day: "numeric" }) : "-";
