import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../components/ui'
import {
  User,
  ShieldCheck,
  Building2,
  Phone,
  KeyRound,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react'

export default function Profile() {
  const auth = useAuth()
  const user = auth?.user || {}

  const fullName = user.fullName || user.FullName || user.name || 'User Profile'
  const role = user.role || user.Role || user.roleName || 'Member'
  const userId = user.userId || user.UserId || user.userName || user.UserName || '-'
  const mobile = user.mobileNumber || user.MobileNumber || '-'
  const company = user.companyName || user.CompanyName || 'Uabindia HRMS'

  const allowedPages = user.allowedPages || user.AllowedPages || []

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'HR'

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8 antialiased w-full">
      {/* ========================================================= */}
      {/* 1. EXECUTIVE PROFILE HEADER CARD                          */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar Pill */}
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-700 via-rose-600 to-orange-500 font-extrabold text-white text-lg shadow-md shadow-purple-600/20">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                  {fullName}
                </h1>
                <Badge tone="purple" dot size="sm">
                  {role}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  ID: <strong className="text-slate-700 font-medium font-mono">{userId}</strong>
                </span>
                <span>•</span>
                <span className="truncate">{company}</span>
              </p>
            </div>
          </div>

          <Link to="/change-password" className="self-start sm:self-auto shrink-0">
            <Button variant="secondary" size="sm" icon={KeyRound}>
              Change Password
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PROFILE DETAILS GRID                                   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Information Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <User size={14} />
            </div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Account Credentials
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Full Name</span>
              <span className="font-semibold text-slate-800">{fullName}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Login ID / Username</span>
              <span className="font-semibold text-slate-800 font-mono">{userId}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Registered Mobile</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                <Phone size={12} className="text-slate-400" />
                {mobile}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Company Assignment</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Building2 size={12} className="text-slate-400" />
                {company}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">System Role</span>
              <Badge tone="purple" size="sm">
                {role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Assigned Operational Area */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Building2 size={14} />
            </div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Organization & Access Scope
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Primary Organization
              </div>
              <div className="font-bold text-slate-800">{company}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Security Governance
              </div>
              <Badge tone="slate" size="sm">
                {role}
              </Badge>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Operational Scope
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100 font-medium">
                {String(role).toLowerCase().includes('superadmin')
                  ? 'Global Multi-Tenant Administration Scope'
                  : 'Tenant Organization & Regional Scope'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ACCESS & PERMISSIONS MATRIX                            */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Layers size={14} />
            </div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Assigned Permissions & Modules
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {allowedPages.length > 0 ? `${allowedPages.length} active permissions` : 'Role Default Access'}
          </span>
        </div>

        {allowedPages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allowedPages.map((page) => (
              <span
                key={page}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-white transition"
              >
                <CheckCircle2 size={13} className="text-purple-700" />
                <span>{page}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-3.5 text-xs text-slate-500">
            This account operates under standard {role} group policies granting access across Dashboard, HRMS Workbench, and Administration modules.
          </div>
        )}
      </div>
    </div>
  )
}
