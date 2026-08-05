"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FileText, Plus, DollarSign, Edit, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  balance: number;
  isGroup: boolean;
  children?: AccountNode[];
}

const INITIAL_ACCOUNTS: AccountNode[] = [
  {
    id: "1",
    code: "1000",
    name: "Assets",
    type: "Asset",
    balance: 14500000,
    isGroup: true,
    children: [
      {
        id: "11",
        code: "1100",
        name: "Current Assets",
        type: "Asset",
        balance: 8500000,
        isGroup: true,
        children: [
          { id: "111", code: "1110", name: "HDFC Bank Operating Account", type: "Asset", balance: 5400000, isGroup: false },
          { id: "112", code: "1120", name: "Petty Cash Account", type: "Asset", balance: 100000, isGroup: false },
          { id: "113", code: "1130", name: "Accounts Receivable (Trade)", type: "Asset", balance: 3000000, isGroup: false },
        ],
      },
      {
        id: "12",
        code: "1200",
        name: "Fixed Assets",
        type: "Asset",
        balance: 6000000,
        isGroup: true,
        children: [
          { id: "121", code: "1210", name: "Office Furniture & Fixtures", type: "Asset", balance: 1500000, isGroup: false },
          { id: "122", code: "1220", name: "IT Hardware & Servers", type: "Asset", balance: 4500000, isGroup: false },
        ],
      },
    ],
  },
  {
    id: "2",
    code: "2000",
    name: "Liabilities",
    type: "Liability",
    balance: 4200000,
    isGroup: true,
    children: [
      { id: "21", code: "2100", name: "Accounts Payable (Vendors)", type: "Liability", balance: 2800000, isGroup: false },
      { id: "22", code: "2200", name: "GST & Tax Payable", type: "Liability", balance: 1400000, isGroup: false },
    ],
  },
  {
    id: "3",
    code: "3000",
    name: "Equity",
    type: "Equity",
    balance: 10300000,
    isGroup: true,
    children: [
      { id: "31", code: "3100", name: "Share Capital", type: "Equity", balance: 8000000, isGroup: false },
      { id: "32", code: "3200", name: "Retained Earnings", type: "Equity", balance: 2300000, isGroup: false },
    ],
  },
];

function AccountTreeNode({ node, level = 0 }: { node: AccountNode; level?: number }) {
  const [expanded, setExpanded] = useState(true);

  const getTypeBadge = (type: AccountNode["type"]) => {
    switch (type) {
      case "Asset": return "success";
      case "Liability": return "warning";
      case "Equity": return "secondary";
      case "Revenue": return "success";
      case "Expense": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-1">
      <div
        className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors text-sm"
        style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {node.isGroup ? (
            <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}

          {node.isGroup ? <Folder className="h-4 w-4 text-indigo-500 shrink-0" /> : <FileText className="h-4 w-4 text-slate-400 shrink-0" />}

          <span className="font-mono text-xs font-semibold text-muted-foreground">{node.code}</span>
          <span className="font-medium text-foreground truncate">{node.name}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Badge variant={getTypeBadge(node.type)} className="text-[10px]">
            {node.type}
          </Badge>
          <span className="font-mono font-bold text-foreground text-sm w-32 text-right">
            ₹{node.balance.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {expanded && node.children && node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <AccountTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartOfAccountsTree() {
  const [accounts] = useState<AccountNode[]>(INITIAL_ACCOUNTS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts (COA)"
        subtitle="General ledger account hierarchy, balance sheet categories, and income statement setup"
        breadcrumbs={[
          { label: "Finance", href: "/finance" },
          { label: "Chart of Accounts" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">General Ledger Structure</CardTitle>
            <CardDescription className="text-xs font-mono">Hierarchical View</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts.map((acc) => (
            <AccountTreeNode key={acc.id} node={acc} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
