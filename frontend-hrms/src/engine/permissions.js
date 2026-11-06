/**
 * Uabindia HRMS Metadata Role & Permission Check Engine
 */

export function checkUserPermission(user, { requiredRole, restrictedRole, requiredPermission } = {}) {
  if (!user) return false

  const userRole = String(user.roleName || user.role || user.Role || '').toLowerCase().trim()
  const isSuperAdmin = userRole.includes('superadmin')

  // SuperAdmin has global bypass unless explicitly restricted
  if (restrictedRole) {
    const isRestricted = userRole.includes(String(restrictedRole).toLowerCase().trim())
    if (isRestricted) return false
  }

  if (requiredRole) {
    const target = String(requiredRole).toLowerCase().trim()
    if (!userRole.includes(target) && !isSuperAdmin) {
      return false
    }
  }

  if (requiredPermission && !isSuperAdmin) {
    const allowed = user.allowedPages || user.AllowedPages || []
    if (Array.isArray(allowed)) {
      if (allowed.includes('*')) return true
      const normalizedAllowed = allowed.map(p => String(p).toLowerCase().trim())
      const targetPerm = String(requiredPermission).toLowerCase().trim()
      if (!normalizedAllowed.includes(targetPerm)) {
        return false
      }
    }
  }

  return true
}

export default {
  checkUserPermission,
}
