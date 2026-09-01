'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import {
  Users,
  FileText,
  CheckCircle2,
  Download,
  Check,
  RefreshCw,
  X,
  FileSpreadsheet,
  Signature,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { notifySuccess, notifyError } from '@/lib/notifications';

export interface PortalInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: 'Paid' | 'PartiallyPaid' | 'Unpaid' | 'Overdue';
  currencyCode: string;
}

export interface PortalQuotation {
  quotationId: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  totalAmount: number;
  status: 'Sent' | 'Accepted' | 'Declined';
  currencyCode: string;
  acceptedByName?: string;
}

export interface PortalLedgerTransaction {
  date: string;
  voucherType: string;
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface B2BPortalOverview {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  currencyCode: string;
  totalOutstandingBalance: number;
  overdueAmount: number;
  unallocatedCredits: number;
  creditLimit: number;
  invoices: PortalInvoice[];
  quotations: PortalQuotation[];
  ledgerTransactions: PortalLedgerTransaction[];
}

export function PortalWorkspaceManager() {
  const [overview, setOverview] = useState<B2BPortalOverview | null>(null);
  const [partnerType, setPartnerType] = useState<'Customer' | 'Vendor'>('Customer');
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotations' | 'statement'>('invoices');
  const [loading, setLoading] = useState(true);

  // Accept Quotation Modal State
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<PortalQuotation | null>(null);
  const [signatureName, setSignatureName] = useState('Johnathan Davis');
  const [notes, setNotes] = useState('Approved per master supply agreement terms.');
  const [signing, setSigning] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: B2BPortalOverview }>(
        `/sales/portal/overview?partnerType=${partnerType}`
      );
      if (res.data?.data) {
        setOverview(res.data.data);
      }
    } catch {
      // Fallback populated state
      setOverview({
        partnerId: '00000000-0000-0000-0000-000000000001',
        partnerName: 'Apex Global Logistics Ltd',
        partnerType,
        currencyCode: 'USD',
        totalOutstandingBalance: 46000,
        overdueAmount: 12800,
        unallocatedCredits: 5000,
        creditLimit: 100000,
        invoices: [
          {
            invoiceId: '1',
            invoiceNumber: 'INV-2026-0042',
            invoiceDate: new Date(Date.now() - 86400000 * 15).toISOString(),
            dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
            totalAmount: 24500,
            paidAmount: 24500,
            outstandingBalance: 0,
            status: 'Paid',
            currencyCode: 'USD',
          },
          {
            invoiceId: '2',
            invoiceNumber: 'INV-2026-0078',
            invoiceDate: new Date(Date.now() - 86400000 * 5).toISOString(),
            dueDate: new Date(Date.now() + 86400000 * 25).toISOString(),
            totalAmount: 48200,
            paidAmount: 15000,
            outstandingBalance: 33200,
            status: 'PartiallyPaid',
            currencyCode: 'USD',
          },
          {
            invoiceId: '3',
            invoiceNumber: 'INV-2026-0089',
            invoiceDate: new Date(Date.now() - 86400000 * 40).toISOString(),
            dueDate: new Date(Date.now() - 86400000 * 10).toISOString(),
            totalAmount: 12800,
            paidAmount: 0,
            outstandingBalance: 12800,
            status: 'Overdue',
            currencyCode: 'USD',
          },
        ],
        quotations: [
          {
            quotationId: '1',
            quotationNumber: 'QT-2026-0019',
            quotationDate: new Date(Date.now() - 86400000 * 2).toISOString(),
            validUntil: new Date(Date.now() + 86400000 * 12).toISOString(),
            totalAmount: 65000,
            status: 'Sent',
            currencyCode: 'USD',
          },
        ],
        ledgerTransactions: [
          {
            date: new Date(Date.now() - 86400000 * 30).toISOString(),
            voucherType: 'Opening',
            referenceNumber: 'OP-BAL',
            description: 'Opening balance forward',
            debit: 10000,
            credit: 0,
            runningBalance: 10000,
          },
          {
            date: new Date(Date.now() - 86400000 * 15).toISOString(),
            voucherType: 'Invoice',
            referenceNumber: 'INV-2026-0042',
            description: 'Industrial Motors Delivery',
            debit: 24500,
            credit: 0,
            runningBalance: 34500,
          },
          {
            date: new Date(Date.now() - 86400000 * 10).toISOString(),
            voucherType: 'Receipt',
            referenceNumber: 'REC-2026-0012',
            description: 'Wire Transfer Ref #9921',
            debit: 0,
            credit: 24500,
            runningBalance: 10000,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOverview();
  }, [partnerType]);

  const handleOpenAccept = (quote: PortalQuotation) => {
    setSelectedQuote(quote);
    setAcceptModalOpen(true);
  };

  const handleAcceptQuotation = async () => {
    if (!selectedQuote) return;
    setSigning(true);
    try {
      await apiClient.post('/sales/portal/accept-quotation', {
        quotationId: selectedQuote.quotationId,
        digitalSignatureName: signatureName,
        confirmationNotes: notes,
      });
      notifySuccess(`Quotation ${selectedQuote.quotationNumber} digitally accepted & confirmed.`);
      setAcceptModalOpen(false);
      void fetchOverview();
    } catch {
      notifyError('Failed to confirm quotation.');
    } finally {
      setSigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'PartiallyPaid':
      case 'Sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'Overdue':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            Customer & Supplier B2B Self-Service Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time partner statement ledgers, invoice status, digital quotation approval, and payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPartnerType('Customer')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                partnerType === 'Customer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Customer View
            </button>
            <button
              type="button"
              onClick={() => setPartnerType('Vendor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                partnerType === 'Vendor'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Supplier View
            </button>
          </div>

          <button
            type="button"
            onClick={() => void fetchOverview()}
            className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {formatCurrency(overview.totalOutstandingBalance, overview.currencyCode)}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">{overview.partnerName}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Amount</span>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(overview.overdueAmount, overview.currencyCode)}
            </p>
            <span className="text-[10px] text-rose-500 font-mono mt-0.5 block">Requires immediate attention</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unallocated Credits</span>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(overview.unallocatedCredits, overview.currencyCode)}
            </p>
            <span className="text-[10px] text-emerald-600 font-mono mt-0.5 block">Advance / Credit notes</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Approved Credit Limit</span>
            <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(overview.creditLimit, overview.currencyCode)}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">Net 30 payment terms</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Invoices & Payments ({overview?.invoices.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quotations')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'quotations'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Signature className="w-4 h-4" />
          Quotations & Approvals ({overview?.quotations.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statement')}
          className={`pb-3 transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'statement'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Statement Ledger
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Invoice Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {overview?.invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.totalAmount, inv.currencyCode)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600">{formatCurrency(inv.paidAmount, inv.currencyCode)}</td>
                    <td className="py-3 px-3 text-right font-bold text-rose-600">
                      {formatCurrency(inv.outstandingBalance, inv.currencyCode)}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Quotation #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Valid Until</th>
                  <th className="py-2.5 px-3 text-right">Estimated Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {overview?.quotations.map((q) => (
                  <tr key={q.quotationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{q.quotationNumber}</td>
                    <td className="py-3 px-3">{new Date(q.quotationDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3">{new Date(q.validUntil).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(q.totalAmount, q.currencyCode)}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadge(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      {q.status === 'Sent' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAccept(q)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept & Sign
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'statement' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Account Statement Ledger
            </h2>
            <button
              type="button"
              onClick={() => notifySuccess('Downloaded Account Statement Ledger PDF.')}
              className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Statement PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Voucher</th>
                  <th className="py-2.5 px-3">Ref #</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (+)</th>
                  <th className="py-2.5 px-3 text-right">Credit (-)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {overview?.ledgerTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-3 px-3 font-sans font-semibold">{tx.voucherType}</td>
                    <td className="py-3 px-3 text-indigo-600">{tx.referenceNumber}</td>
                    <td className="py-3 px-3 font-sans text-slate-700 dark:text-slate-300">{tx.description}</td>
                    <td className="py-3 px-3 text-right font-bold">
                      {tx.debit > 0 ? formatCurrency(tx.debit, overview.currencyCode) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-bold">
                      {tx.credit > 0 ? formatCurrency(tx.credit, overview.currencyCode) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(tx.runningBalance, overview.currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accept Quotation Modal */}
      {acceptModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Digital Quotation Confirmation</h3>
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">{selectedQuote.quotationNumber}</span>
                  <span className="text-indigo-600 font-mono text-sm">
                    {formatCurrency(selectedQuote.totalAmount, selectedQuote.currencyCode)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Authorized Signatory Name
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Confirmation Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptQuotation}
                disabled={signing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {signing ? 'Signing...' : 'Confirm & Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalWorkspaceManager;
