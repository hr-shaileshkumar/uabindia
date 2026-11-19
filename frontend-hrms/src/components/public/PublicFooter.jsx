import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  Globe2,
  Mail,
  Heart,
} from "lucide-react";

export const PublicFooter = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-xs antialiased">
      {/* Upper Footer: Pillars & Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-blue-600/30">
                U
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                Uabindia <span className="text-blue-500">HRMS</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The high-performance Human Resource Management System purpose-built for fast-scaling Indian enterprises. From geofenced duty capture to 1-click compliant payroll and ATS Kanban.
            </p>

            {/* Compliance Badges Pill Grid */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10.5px] font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                SOC-2 Type II Certified
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10.5px] font-semibold text-blue-400">
                <Lock className="w-3.5 h-3.5" />
                256-bit TLS Encryption
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10.5px] font-semibold text-amber-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                EPF & ESI Statutory Ready
              </span>
            </div>
          </div>

          {/* Module Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Workforce Engine
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Core HR & 360 Dossier
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Geofence Attendance
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Muster Roll & Rosters
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Leave & Absence Policies
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Workforce Movement
                </Link>
              </li>
            </ul>
          </div>

          {/* Talent & Payroll */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Talent & Payroll
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  ATS Recruitment Kanban
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  1-Click Payroll Run
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Auto Payslips & Form 16
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Self-Service Portals (ESS)
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Manager Approval Cockpit
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Trust */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Enterprise Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Client Console Login
                </Link>
              </li>
              <li>
                <span className="text-slate-500">ISO 27001 Security Standard</span>
              </li>
              <li>
                <span className="text-slate-500">Zero Trust Architecture</span>
              </li>
              <li>
                <span className="text-slate-500">Multi-Tenant Isolation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 bg-black/40 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} UabIndia Technologies Private Limited. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Cloud Systems Operational (99.99%)</span>
            </div>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Policy</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
