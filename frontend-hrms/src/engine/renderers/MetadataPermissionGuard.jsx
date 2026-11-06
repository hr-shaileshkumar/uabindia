import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { ShieldAlert } from 'lucide-react'
import { checkUserPermission } from '../permissions'

export { checkUserPermission }

export default function MetadataPermissionGuard({
  requiredRole,
  restrictedRole,
  requiredPermission,
  fallback = null,
  showNotice = false,
  children,
}) {
  const auth = useAuth()
  const hasAccess = checkUserPermission(auth?.user, {
    requiredRole,
    restrictedRole,
    requiredPermission,
  })

  if (hasAccess) {
    return <>{children}</>
  }

  if (showNotice) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center text-xs text-amber-800">
        <ShieldAlert size={24} className="mx-auto text-amber-600 mb-2" />
        <p className="font-bold">Restricted View</p>
        <p className="mt-0.5 text-amber-700">
          You do not have the required role or permission to view this section or record.
        </p>
      </div>
    )
  }

  return fallback
}
