"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Trash2 } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter } from "@/components/workspace/page-kit";
import { JournalBalanceIndicator } from "@/components/workspace/journal-balance-indicator";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpStatusBadgeTone,
  erpTableRowHoverClassName,
  erpTableTdClassName,
  erpTableThClassName,
  erpTableWrapClassName,
} from "@/components/workspace/styles";
import { financeApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useDocumentMasters } from "@/components/workspace/document-kit";
import { formatCurrency } from "@/lib/formatters";
import { useLocalization } from "@/context/LocalizationContext";
import { validateJournalEntry } from "@/features/finance/journal-entries/validations/journal-entry.schema";

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  memo: string;
}

type JournalEntrySummary = {
  id: string;
  journalNumber: string;
  entryDate: string;
  entryType?: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  description?: string;
};

const emptyLine = (): JournalLine => ({
  id: String(Date.now()) + Math.random(),
  accountId: "",
  debit: 0,
  credit: 0,
  memo: "",
});

const statusTone = (status: string) => {
  switch (status) {
    case "Posted":
      return erpStatusBadgeTone.success;
    case "Draft":
      return erpStatusBadgeTone.warning;
    case "Voided":
      return erpStatusBadgeTone.danger;
    default:
      return erpStatusBadgeTone.neutral;
  }
};

export function JournalEntryForm() {
  const { activeCountry } = useLocalization();
  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);

  // Master data
  const { accounts } = useDocumentMasters();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.journalEntries.list(1, 50);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setEntries(list as JournalEntrySummary[]);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load journal entries.");
      setError(message);
      notifyError(message, "Finance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const addLine = () => setLines((current) => [...current, emptyLine()]);

  const removeLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines((current) => current.filter((line) => line.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: string | number) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const resetForm = () => {
    setEntryDate(new Date().toISOString().split("T")[0]);
    setReference("");
    setNarration("");
    setLines([emptyLine(), emptyLine()]);
  };

  const handleSave = async () => {
    const payload = {
      entryDate,
      referenceNumber: reference || undefined,
      narration: narration || undefined,
      description: narration || undefined,
      lines: lines
        .filter((line) => line.accountId && (Number(line.debit) > 0 || Number(line.credit) > 0))
        .map((line) => ({
          accountId: line.accountId,
          debitAmount: Number(line.debit) || 0,
          creditAmount: Number(line.credit) || 0,
          description: line.memo || undefined,
        })),
    };

    const validation = validateJournalEntry(payload);
    if (!validation.success) {
      setError(validation.error || "Journal entry validation failed.");
      return;
    }

    try {
      setSaving(true);
      await financeApi.journalEntries.create(validation.data!);
      notifySuccess("Journal entry saved as draft.");
      setShowForm(false);
      resetForm();
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save journal entry.");
      setError(message);
      notifyError(message, "Finance");
    } finally {
      setSaving(false);
    }
  };

  const draftCount = entries.filter((entry) => entry.status === "Draft").length;
  const postedCount = entries.filter((entry) => entry.status === "Posted").length;

  return (
    <StandardPageLayout
      title="Journal Entries"
      subtitle="Record double-entry transactions and review posted journal history."
      eyebrow="Finance / Journal Entries"
      icon="file"
      meta={
        !loading ? (
          <>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {entries.length} entries
            </span>
            <span className={erpStatusBadgeTone.warning}>{draftCount} draft</span>
            <span className={erpStatusBadgeTone.success}>{postedCount} posted</span>
          </>
        ) : null
      }
      actions={<ErpCreateButton label="New entry" onClick={() => setShowForm(true)} />}
    >
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Journal register</h2>
        </div>
        <div className={erpPanelBodyClassName}>
          <div className={erpTableWrapClassName}>
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className={erpTableThClassName}>Journal #</th>
                  <th className={erpTableThClassName}>Date</th>
                  <th className={erpTableThClassName}>Type</th>
                  <th className={erpTableThClassName}>Description</th>
                  <th className={erpTableThClassName}>Debit</th>
                  <th className={erpTableThClassName}>Credit</th>
                  <th className={erpTableThClassName}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className={erpTableTdClassName}>
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`${erpTableTdClassName} py-12 text-center`}>
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-10 w-10 text-slate-300" />
                        <p className="text-sm text-slate-500">No journal entries yet. Use New entry in the header to post the first draft.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className={erpTableRowHoverClassName}>
                      <td className={`${erpTableTdClassName} font-mono text-sm font-semibold text-slate-900`}>
                        {entry.journalNumber}
                      </td>
                      <td className={erpTableTdClassName}>
                        {new Date(entry.entryDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className={erpTableTdClassName}>{entry.entryType || "Regular"}</td>
                      <td className={erpTableTdClassName}>{entry.description || "—"}</td>
                      <td className={erpTableTdClassName}>{formatCurrency(entry.totalDebit)}</td>
                      <td className={erpTableTdClassName}>{formatCurrency(entry.totalCredit)}</td>
                      <td className={erpTableTdClassName}>
                        <span className={statusTone(entry.status)}>{entry.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <SideDrawer
        open={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title="New journal entry"
        subtitle="Record a balanced double-entry draft."
        width="2xl"
        footer={
          <ErpDrawerFooter
            onCancel={() => {
              setShowForm(false);
              resetForm();
            }}
            onSave={() => void handleSave()}
            saving={saving}
            disabled={!isBalanced}
            saveLabel="Save draft"
          />
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="jv-date" className={erpFormLabelClassName}>
                Posting date
              </label>
              <input
                id="jv-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className={`${erpFormInputClassName} mt-1`}
              />
            </div>
            <div>
              <label htmlFor="jv-ref" className={erpFormLabelClassName}>
                Reference
              </label>
              <input
                id="jv-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional reference"
                className={`${erpFormInputClassName} mt-1`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="jv-narration" className={erpFormLabelClassName}>
                Narration
              </label>
              <input
                id="jv-narration"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Describe the entry purpose"
                className={`${erpFormInputClassName} mt-1`}
              />
            </div>
          </div>

          <JournalBalanceIndicator totalDebit={totalDebit} totalCredit={totalCredit} />

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className={erpTableThClassName}>Account</th>
                  <th className={erpTableThClassName}>Memo</th>
                  <th className={`${erpTableThClassName} text-right`}>Debit</th>
                  <th className={`${erpTableThClassName} text-right`}>Credit</th>
                  <th className={`${erpTableThClassName} text-center`} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className={erpTableTdClassName}>
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(line.id, "accountId", e.target.value)}
                        className={erpFormInputClassName}
                      >
                        <option value="">Select account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={erpTableTdClassName}>
                      <input
                        value={line.memo}
                        onChange={(e) => updateLine(line.id, "memo", e.target.value)}
                        placeholder="Line memo"
                        className={erpFormInputClassName}
                      />
                    </td>
                    <td className={erpTableTdClassName}>
                      <input
                        type="number"
                        min={0}
                        value={line.debit || ""}
                        onChange={(e) => updateLine(line.id, "debit", Number(e.target.value))}
                        className={`${erpFormInputClassName} text-right font-mono`}
                      />
                    </td>
                    <td className={erpTableTdClassName}>
                      <input
                        type="number"
                        min={0}
                        value={line.credit || ""}
                        onChange={(e) => updateLine(line.id, "credit", Number(e.target.value))}
                        className={`${erpFormInputClassName} text-right font-mono`}
                      />
                    </td>
                    <td className={`${erpTableTdClassName} text-center`}>
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold">
                <tr>
                  <td colSpan={2} className={erpTableTdClassName}>
                    Totals
                  </td>
                  <td className={`${erpTableTdClassName} text-right font-mono text-slate-900`}>
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className={`${erpTableTdClassName} text-right font-mono text-slate-900`}>
                    {formatCurrency(totalCredit)}
                  </td>
                  <td className={`${erpTableTdClassName} text-center`}>
                    {isBalanced ? (
                      <CheckCircle2 className="inline h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="inline h-5 w-5 text-rose-500" />
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!isBalanced ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}. Debits and credits must balance.
            </div>
          ) : null}

          <button type="button" onClick={addLine} className={erpButtonClassName.secondary}>
            Add line
          </button>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
