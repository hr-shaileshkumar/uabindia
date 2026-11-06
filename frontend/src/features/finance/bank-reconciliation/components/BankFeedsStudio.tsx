"use client";

import { Plus, Sparkles, UploadCloud } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  formatDate,
  type ParsedBankStatement,
} from "../types/reconciliation.types";

interface BankFeedsStudioProps {
  feedFormat: "ofx" | "mt940" | "csv";
  onFeedFormatChange: (format: "ofx" | "mt940" | "csv") => void;
  feedCurrency: string;
  onFeedCurrencyChange: (currency: string) => void;
  feedContent: string;
  onFeedContentChange: (content: string) => void;
  isParsingFeed: boolean;
  onParseFeed: () => void;
  onLoadSample: (format: "ofx" | "mt940" | "csv") => void;
  parsedStatement: ParsedBankStatement | null;
  onCreateFromFeed: (closingBalance: number) => void;
}

export function BankFeedsStudio({
  feedFormat,
  onFeedFormatChange,
  feedCurrency,
  onFeedCurrencyChange,
  feedContent,
  onFeedContentChange,
  isParsingFeed,
  onParseFeed,
  onLoadSample,
  parsedStatement,
  onCreateFromFeed,
}: BankFeedsStudioProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Universal Electronic Statement Feed Ingestion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload, paste, or test standard banking interchange payloads (OFX/QFX, SWIFT MT940, or Bank CSV)
              to extract statement closing balances and transactions.
            </p>
          </div>

          {/* Sample Preset Loaders */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Quick Test Samples:</span>
            <button
              type="button"
              onClick={() => onLoadSample("ofx")}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Load Demo OFX
            </button>
            <button
              type="button"
              onClick={() => onLoadSample("mt940")}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Load Demo MT940
            </button>
            <button
              type="button"
              onClick={() => onLoadSample("csv")}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Load Demo CSV
            </button>
          </div>
        </div>

        {/* Format Selection & Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Feed Interchange Standard
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onFeedFormatChange("ofx")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  feedFormat === "ofx"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                OFX / QFX XML
              </button>
              <button
                type="button"
                onClick={() => onFeedFormatChange("mt940")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  feedFormat === "mt940"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                MT940 (SWIFT)
              </button>
              <button
                type="button"
                onClick={() => onFeedFormatChange("csv")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  feedFormat === "csv"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Standard Bank CSV
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Default Settlement Currency
            </label>
            <select
              value={feedCurrency}
              onChange={(e) => onFeedCurrencyChange(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="AED">AED (د.إ) - UAE Dirham</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
              <option value="SGD">SGD ($) - Singapore Dollar</option>
            </select>
          </div>
        </div>

        {/* Raw Statement Payload Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Raw Statement Content ({feedFormat.toUpperCase()})
            </label>
            {feedContent && (
              <button
                type="button"
                onClick={() => onFeedContentChange("")}
                className="text-xs text-slate-400 hover:text-rose-500 transition cursor-pointer"
              >
                Clear Content
              </button>
            )}
          </div>
          <textarea
            value={feedContent}
            onChange={(e) => onFeedContentChange(e.target.value)}
            rows={10}
            placeholder={
              feedFormat === "ofx"
                ? "Paste raw OFX / QFX statement XML payload here..."
                : feedFormat === "mt940"
                ? "Paste raw SWIFT MT940 statement message lines here..."
                : "Paste CSV content (e.g. Date,Description,Reference,Type,Amount,Payee)..."
            }
            className="w-full p-4 font-mono text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Parse Action Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onParseFeed}
            disabled={isParsingFeed || !feedContent.trim()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isParsingFeed ? "Parsing Bank Feed..." : "Parse & Extract Transactions"}
          </button>
        </div>

        {/* Parsed Result Display */}
        {parsedStatement && (
          <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Extracted Statement Summary
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Account: {parsedStatement.accountNumber || "Primary Treasury Account"}
                </h4>
                <p className="text-xs text-slate-500">
                  Currency: <strong>{parsedStatement.currency}</strong> • Total Transactions:{" "}
                  <strong>{parsedStatement.transactions.length}</strong>
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Opening Balance</span>
                  <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(parsedStatement.openingBalance, parsedStatement.currency)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Statement Closing Balance</span>
                  <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(parsedStatement.closingBalance, parsedStatement.currency)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateFromFeed(parsedStatement.closingBalance)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Reconciliation from Feed
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300">
                Extracted Statement Transactions ({parsedStatement.transactions.length})
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Reference</th>
                      <th className="py-2.5 px-4">Description / Memo</th>
                      <th className="py-2.5 px-4">Payee / Payer</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedStatement.transactions.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {formatDate(txn.transactionDate)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              txn.transactionType === "Credit"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                            }`}
                          >
                            {txn.transactionType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {txn.referenceNumber || "-"}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {txn.description}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{txn.payeePayer || "-"}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-bold ${
                            txn.transactionType === "Credit"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {txn.transactionType === "Credit" ? "+" : "-"}
                          {formatCurrency(Math.abs(txn.amount), parsedStatement.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
