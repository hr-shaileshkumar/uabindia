import React from 'react'
import { ShieldCheck, ExternalLink, ArrowRight, Building2 } from 'lucide-react'

export default function SuperAdminRedirect({ title = 'Platform Governance Centralized' }) {
  const targetUrl = window.location.port === '5173' ? 'http://localhost:3000/superadmin/dashboard' : '/superadmin/dashboard'

  return (
    <div className="flex min-h-[500px] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
          <Building2 className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          In accordance with enterprise zero-trust security standards, SuperAdmin tenant provisioning, billing setup, and platform configuration have been centralized into the main <strong>Cloud ERP Control Plane</strong>.
        </p>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-left text-xs text-blue-900">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <span className="font-semibold">Centralized Control:</span>
              <p className="mt-0.5 text-[11px] text-blue-700">
                Please use the Next.js ERP Platform Console to manage multi-tenant lifecycle, row-level permissions, and provider configurations.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <a
            href={targetUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            Launch Cloud ERP SuperAdmin Console <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to HRMS Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
