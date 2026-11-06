import React, { useState, useRef, useEffect } from 'react';
import {
  Grid,
  Users,
  CreditCard,
  Truck,
  Package,
  Briefcase,
  ShoppingCart,
  BarChart3,
  Factory,
  Settings,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const erpBaseUrl = import.meta.env.VITE_ERP_BASE_URL || 'http://localhost:3000';

const APPS = [
  {
    id: 'hrms',
    name: 'HRMS & Payroll',
    desc: 'Attendance, staff profiles, leave & salary register',
    href: '/dashboard',
    icon: Users,
    color: 'from-purple-600 to-indigo-600',
    isCurrent: true,
  },
  {
    id: 'erp',
    name: 'Enterprise ERP',
    desc: 'Main operations, projects & global dashboard',
    href: `${erpBaseUrl}/dashboard`,
    icon: Sparkles,
    color: 'from-blue-600 to-cyan-600',
    external: true,
    tag: 'Core ERP',
  },
  {
    id: 'finance',
    name: 'Finance & Accounts',
    desc: 'General ledger, charts of accounts & P&L',
    href: `${erpBaseUrl}/finance`,
    icon: BarChart3,
    color: 'from-emerald-600 to-teal-700',
    external: true,
  },
  {
    id: 'crm',
    name: 'Sales & CRM',
    desc: 'Lead tracking, pipelines, customer accounts',
    href: `${erpBaseUrl}/sales`,
    icon: Briefcase,
    color: 'from-rose-600 to-pink-600',
    external: true,
  },
  {
    id: 'inventory',
    name: 'Inventory & WMS',
    desc: 'Multi-warehouse stock, goods transfers & stock aging',
    href: `${erpBaseUrl}/inventory`,
    icon: Package,
    color: 'from-amber-500 to-orange-600',
    external: true,
  },
  {
    id: 'procurement',
    name: 'Procurement',
    desc: 'Purchase requests, vendor RFQs & orders',
    href: `${erpBaseUrl}/procurement`,
    icon: ShoppingCart,
    color: 'from-red-600 to-rose-700',
    external: true,
  },
  {
    id: 'fleet',
    name: 'Fleet & Logistics',
    desc: 'Telemetry, driver logs & delivery dispatch',
    href: `${erpBaseUrl}/fleet`,
    icon: Truck,
    color: 'from-indigo-600 to-blue-700',
    external: true,
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & BOM',
    desc: 'Work stations, bills of materials & scheduling',
    href: `${erpBaseUrl}/manufacturing`,
    icon: Factory,
    color: 'from-slate-700 to-slate-900',
    external: true,
  },
];

export default function AppLauncher() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer active:scale-95 ${
          open
            ? 'bg-purple-100 text-purple-700'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="UAB India Suite Apps (Google Waffle)"
        aria-label="App Launcher"
      >
        <Grid size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white font-black text-xs">
                U
              </div>
              <span className="font-bold text-xs text-slate-900 tracking-tight">
                UAB India Enterprise Suite
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              SSO Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-[380px] overflow-y-auto p-0.5">
            {APPS.map((app) => {
              const Icon = app.icon;
              return (
                <a
                  key={app.id}
                  href={app.href}
                  target={app.external ? '_blank' : '_self'}
                  rel={app.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setOpen(false)}
                  className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                    app.isCurrent
                      ? 'border-purple-200 bg-purple-50/50 shadow-xs'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-xs'
                  }`}
                >
                  {app.tag && (
                    <span className="absolute top-1 right-1 text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-blue-100 text-blue-800">
                      {app.tag}
                    </span>
                  )}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} text-white shadow-sm transition group-hover:scale-105 mb-1.5`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 group-hover:text-purple-700">
                    {app.name}
                  </span>
                  <span className="text-[9px] text-slate-400 line-clamp-1 leading-tight">
                    {app.isCurrent ? 'Current App' : '1-Click SSO'}
                  </span>
                </a>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck size={12} className="text-emerald-600" /> Single Identity Account
            </span>
            <span className="text-[10px] text-purple-700 font-medium">
              v1.0 Unified
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

