"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo: string;
}

export function JournalEntryForm() {
  const [entryDate, setEntryDate] = useState("2026-08-03");
  const [reference, setReference] = useState("JV-2026-0089");
  const [narration, setNarration] = useState("Monthly rent & utility allocation");

  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountCode: "6100", accountName: "Rent Expense", debit: 150000, credit: 0, memo: "HQ Office Rent" },
    { id: "2", accountCode: "6200", accountName: "Electricity & Utilities", debit: 25000, credit: 0, memo: "Jul Utility Bill" },
    { id: "3", accountCode: "1110", accountName: "HDFC Bank Operating Account", debit: 0, credit: 175000, memo: "Bank Payout" },
  ]);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const addLine = () => {
    const newLine: JournalLine = {
      id: String(Date.now()),
      accountCode: "",
      accountName: "",
      debit: 0,
      credit: 0,
      memo: "",
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(
      lines.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post Journal Entry"
        subtitle="Record general ledger double-entry debit & credit transactions"
        breadcrumbs={[
          { label: "Finance", href: "/finance" },
          { label: "Journal Entries", href: "/journal-entries" },
          { label: "New Entry" },
        ]}
        actions={
          <Button size="sm" disabled={!isBalanced} className="gap-2">
            <Save className="h-4 w-4" />
            Post Entry
          </Button>
        }
      />

      {/* Entry Header Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="jvDate">Posting Date</Label>
            <Input id="jvDate" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jvRef">JV Reference No.</Label>
            <Input id="jvRef" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="narration">Narration / Memo</Label>
            <Input id="narration" placeholder="Explain entry purpose..." value={narration} onChange={(e) => setNarration(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Debit / Credit Lines Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Line Items (Double Entry)</CardTitle>
            <CardDescription className="text-xs">Total Debits must equal Total Credits</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addLine} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Line
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                  <th className="py-2.5 px-3">Account Code & Name</th>
                  <th className="py-2.5 px-3">Memo</th>
                  <th className="py-2.5 px-3 text-right w-36">Debit (INR)</th>
                  <th className="py-2.5 px-3 text-right w-36">Credit (INR)</th>
                  <th className="py-2.5 px-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="e.g. 1110 - HDFC Bank"
                        value={line.accountName ? `${line.accountCode} - ${line.accountName}` : line.accountCode}
                        onChange={(e) => updateLine(line.id, "accountName", e.target.value)}
                        className="h-9 text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="Line memo"
                        value={line.memo}
                        onChange={(e) => updateLine(line.id, "memo", e.target.value)}
                        className="h-9 text-xs"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Input
                        type="number"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(line.id, "debit", Number(e.target.value))}
                        className="h-9 text-xs text-right font-mono font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Input
                        type="number"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(line.id, "credit", Number(e.target.value))}
                        className="h-9 text-xs text-right font-mono font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeLine(line.id)}
                        className="p-1 text-muted-foreground hover:text-rose-600 transition-colors disabled:opacity-30"
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold bg-muted/20 text-sm">
                  <td colSpan={2} className="py-3 px-3">Total Balance Check</td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                    ₹{totalDebit.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                    ₹{totalCredit.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {isBalanced ? (
                      <span title="Balanced"><CheckCircle2 className="h-5 w-5 text-emerald-500 inline-block" /></span>
                    ) : (
                      <span title="Unbalanced"><AlertCircle className="h-5 w-5 text-rose-500 inline-block" /></span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!isBalanced && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Difference: ₹{Math.abs(totalDebit - totalCredit).toLocaleString("en-IN")}. Debits and Credits must balance to zero before posting.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
