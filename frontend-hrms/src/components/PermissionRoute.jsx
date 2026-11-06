import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

// Usage: <PermissionRoute requiredRole="SuperAdmin">...</PermissionRoute>
// Or: <PermissionRoute requiredPages={["Users","Import"]}>...</PermissionRoute>
export default function PermissionRoute({ children, requiredRole, requiredPages }){
  const auth = useAuth()
  const location = useLocation()

  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const role = (auth.user && (auth.user.roleName || auth.user.role || auth.user.Role || '')).toString()
  const isSuperAdmin = role.toLowerCase() === 'superadmin'

  if (isSuperAdmin) {
    return children
  }

  if (requiredRole) {
    if (role.toLowerCase() !== requiredRole.toLowerCase()) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center antialiased">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md">
            Your role (<span className="font-semibold text-slate-700">{role || 'Standard User'}</span>) does not have authorization to access this administrative console.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-800 transition shadow-xs"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      )
    }
    return children
  }

  if (requiredPages && requiredPages.length > 0) {
    const rawAllowed = auth.user && (auth.user.allowedPages || auth.user.AllowedPages || [])
    const allowed = Array.isArray(rawAllowed) ? rawAllowed.map(a => String(a).toLowerCase().trim()) : []
    const hasWildcard = allowed.includes('*')
    const has = hasWildcard || requiredPages.some(rp => allowed.includes(String(rp).toLowerCase().trim()))

    if (!has) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center antialiased">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Module Access Denied</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md">
            Your profile does not have active database permissions for this module. Permissions are managed centrally by your company administrator.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-800 transition shadow-xs"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      )
    }
    return children
  }

  return children
}
