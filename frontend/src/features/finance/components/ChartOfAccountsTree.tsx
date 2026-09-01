"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ChevronDown, Folder, FileText, Plus } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpButtonClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpStatusBadgeTone,
} from "@/components/workspace/styles";
import { financeApi } from "@/services/modules";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  isGroup: boolean;
  children?: AccountNode[];
}

type CoaRecord = {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  isGroup: boolean;
  parentAccountId?: string | null;
};

function buildTree(flat: CoaRecord[]): AccountNode[] {
  const map = new Map<string, AccountNode>();

  flat.forEach((record) => {
    map.set(record.id, {
      id: record.id,
      code: record.accountCode,
      name: record.accountName,
      type: record.accountType,
      balance: record.currentBalance ?? 0,
      isGroup: record.isGroup,
      children: [],
    });
  });

  const roots: AccountNode[] = [];

  flat.forEach((record) => {
    const node = map.get(record.id);
    if (!node) return;

    if (record.parentAccountId && map.has(record.parentAccountId)) {
      map.get(record.parentAccountId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function typeTone(type: string) {
  switch (type) {
    case "Asset":
      return erpStatusBadgeTone.success;
    case "Liability":
      return erpStatusBadgeTone.warning;
    case "Revenue":
    case "Income":
      return erpStatusBadgeTone.info;
    case "Expense":
      return erpStatusBadgeTone.danger;
    default:
      return erpStatusBadgeTone.neutral;
  }
}

function AccountTreeNode({ node, level = 0 }: { node: AccountNode; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = Boolean(node.children?.length);

  return (
    <div className="space-y-1">
      <div
        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2.5 text-sm transition hover:bg-slate-50"
        style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {node.isGroup && hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="p-0.5 text-slate-500 hover:text-slate-900"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {node.isGroup ? (
            <Folder className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
          )}

          <span className="font-mono text-xs font-semibold text-slate-500">{node.code}</span>
          <span className="truncate font-medium text-slate-900">{node.name}</span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className={typeTone(node.type)}>{node.type}</span>
          <span className="w-28 text-right font-mono text-sm font-semibold text-slate-900">
            ₹{node.balance.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {expanded && hasChildren ? (
        <div className="space-y-1">
          {node.children!.map((child) => (
            <AccountTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ChartOfAccountsTree() {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.chartOfAccounts.getAll();
      const list: CoaRecord[] = Array.isArray(res.data) ? res.data : [];
      setAccounts(buildTree(list));
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

  const ledgerCount = accounts.reduce((count, node) => {
    const walk = (n: AccountNode): number =>
      (n.isGroup ? 0 : 1) + (n.children?.reduce((sum, c) => sum + walk(c), 0) ?? 0);
    return count + walk(node);
  }, 0);

  return (
    <StandardPageLayout
      title="Chart of Accounts"
      subtitle="General ledger hierarchy, account types, and current balances."
      eyebrow="Finance / Chart of Accounts"
      icon="book"
      meta={
        !loading ? (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {ledgerCount} ledger accounts
          </span>
        ) : null
      }
      actions={
        <button type="button" className={erpButtonClassName.primary} disabled>
          <Plus className="h-4 w-4" />
          Add account
        </button>
      }
    >
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Account hierarchy</h2>
        </div>
        <div className={erpPanelBodyClassName}>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Folder className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No accounts configured</p>
              <p className="max-w-md text-sm text-slate-500">
                Create your chart of accounts to define assets, liabilities, equity, revenue, and expense ledgers.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {accounts.map((account) => (
                <AccountTreeNode key={account.id} node={account} />
              ))}
            </div>
          )}
        </div>
      </section>
    </StandardPageLayout>
  );
}
