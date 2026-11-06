import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  ShoppingCart,
  Users,
  CreditCard,
  ChevronRight,
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function ApprovalInbox() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals?status=Pending');
      if (Array.isArray(res.data)) {
        setApprovals(res.data);
      }
    } catch (err) {
      // If user has no approval permissions, ignore gracefully
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // Poll for new approvals every 60 seconds
    const timer = setInterval(fetchApprovals, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleAction = async (id, action) => {
    try {
      setActingId(id);
      await api.post(`/approvals/${id}/${action}`, {
        comments: `Actioned via UAB One-Inbox (${action.toUpperCase()})`
      });
      // Remove from list locally
      setApprovals(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(`Failed to ${action} request: ` + (err?.response?.data?.message || err.message));
    } finally {
      setActingId(null);
    }
  };

  const getEntityIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'purchaseorder':
        return <ShoppingCart size={15} className="text-blue-600" />;
      case 'leaveapplication':
      case 'leave':
        return <Users size={15} className="text-purple-600" />;
      case 'expenseclaim':
      case 'expense':
        return <CreditCard size={15} className="text-emerald-600" />;
      default:
        return <FileText size={15} className="text-slate-600" />;
    }
  };

  const pendingCount = approvals.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchApprovals();
        }}
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer active:scale-95 ${
          open
            ? 'bg-amber-100 text-amber-800'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="Unified Approvals (One Inbox)"
        aria-label="Approvals Inbox"
      >
        <CheckSquare size={16} />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 tracking-tight flex items-center gap-1.5">
                <CheckSquare size={14} className="text-amber-600" /> Unified Approvals
              </span>
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {pendingCount} Pending
              </span>
            </div>
            <button
              onClick={fetchApprovals}
              disabled={loading}
              className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-0.5">
            {approvals.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400">No pending requests requiring your approval.</p>
              </div>
            ) : (
              approvals.map((req) => {
                const isActing = actingId === req.id;
                return (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-100 shadow-2xs">
                          {getEntityIcon(req.entityType)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">
                            {req.title || `${req.entityType} Request`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            By {req.requesterName || 'Team Member'} · {req.department || 'Operations'}
                          </span>
                        </div>
                      </div>
                      {req.urgency === 'Urgent' && (
                        <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                          Urgent
                        </span>
                      )}
                    </div>

                    {req.amount && (
                      <div className="text-[11px] font-bold text-slate-800 mb-2 pl-9">
                        Amount: <span className="text-emerald-700">₹{req.amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100/80">
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleAction(req.id, 'reject')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleAction(req.id, 'approve')}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-2xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Approve
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Aggregated cross-module inbox</span>
            <span className="font-semibold text-purple-700">1-Click Decisions</span>
          </div>
        </div>
      )}
    </div>
  );
}

