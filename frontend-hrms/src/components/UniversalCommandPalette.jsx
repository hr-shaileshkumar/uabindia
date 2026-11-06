import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Search,
  Users,
  Building2,
  Package,
  FileText,
  CreditCard,
  Sparkles,
  ArrowRight,
  Command,
  X,
  ExternalLink,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';

const erpBaseUrl = import.meta.env.VITE_ERP_BASE_URL || 'http://localhost:3000';

const STATIC_ACTIONS = [
  {
    id: 'act-payroll-runs',
    category: 'Quick Action',
    title: 'Run Payroll Wizard',
    subtitle: 'Process monthly salaries and statutory contributions',
    path: '/payroll/runs',
    icon: CreditCard,
  },
  {
    id: 'act-pf-ecr',
    category: 'Statutory Compliance',
    title: 'Download EPFO ECR File',
    subtitle: 'Generate text challan for EPFO online portal upload',
    path: '/compliance/pf',
    icon: ShieldCheck,
  },
  {
    id: 'act-new-employee',
    category: 'Quick Action',
    title: 'Onboard New Employee',
    subtitle: 'Add staff profile, bank details and KYC',
    path: '/workforce/employees/create',
    icon: Users,
  },
  {
    id: 'act-erp-dashboard',
    category: 'Ecosystem App',
    title: 'Switch to Enterprise ERP',
    subtitle: 'Open core ERP portal in new tab',
    externalUrl: `${erpBaseUrl}/dashboard`,
    icon: Sparkles,
  },
  {
    id: 'act-erp-finance',
    category: 'Ecosystem App',
    title: 'Finance & General Ledger (ERP)',
    subtitle: 'Chart of accounts, balance sheet and P&L',
    externalUrl: `${erpBaseUrl}/finance`,
    icon: FileText,
  },
  {
    id: 'act-erp-inventory',
    category: 'Ecosystem App',
    title: 'Inventory & WMS (ERP)',
    subtitle: 'Stock balances, batch tracking and goods transfers',
    externalUrl: `${erpBaseUrl}/inventory`,
    icon: Package,
  },
];

export default function UniversalCommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/administration/search?q=${encodeURIComponent(query.trim())}`);
        const serverResults = Array.isArray(res.data?.results) ? res.data.results : [];

        // Match static actions too
        const qLower = query.toLowerCase();
        const matchedActions = STATIC_ACTIONS.filter(
          a => a.title.toLowerCase().includes(qLower) || a.subtitle.toLowerCase().includes(qLower)
        );

        setResults([...matchedActions, ...serverResults]);
        setSelectedIndex(0);
      } catch (err) {
        // Fallback to static actions
        const qLower = query.toLowerCase();
        const matchedActions = STATIC_ACTIONS.filter(
          a => a.title.toLowerCase().includes(qLower) || a.subtitle.toLowerCase().includes(qLower)
        );
        setResults(matchedActions);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (item) => {
    onClose();
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentList = results.length > 0 ? results : STATIC_ACTIONS;
      if (currentList[selectedIndex]) {
        handleSelect(currentList[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  const displayList = results.length > 0 ? results : STATIC_ACTIONS;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-2.5">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search employees, POs, invoices, customers..."
            className="flex-1 text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent border-0 outline-none focus:ring-0"
          />
          {loading && (
            <span className="text-[10px] text-purple-600 font-semibold animate-pulse">
              Searching...
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{results.length > 0 ? `Results (${results.length})` : 'Suggested Quick Actions'}</span>
            <span className="font-mono text-[9px] lowercase text-slate-300">↑↓ to navigate · ↵ to select</span>
          </div>

          {displayList.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            const Icon = item.icon || Sparkles;
            return (
              <div
                key={item.id || idx}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50 text-purple-950 font-bold border border-purple-200/70 shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isSelected ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      {item.title}
                      {item.category && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <div className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  {item.externalUrl ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-purple-600 font-semibold">
                      Open App <ExternalLink size={10} />
                    </span>
                  ) : (
                    <ArrowRight size={14} className={isSelected ? 'text-purple-600' : 'opacity-0'} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px]">
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono shadow-2xs">ESC</kbd> to close
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono shadow-2xs">CTRL</kbd> + <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono shadow-2xs">K</kbd> anywhere
            </span>
          </div>
          <span className="text-[10px] font-bold text-purple-700">UAB Universal Search</span>
        </div>
      </div>
    </div>
  );
}

