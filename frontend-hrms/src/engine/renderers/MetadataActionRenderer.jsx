import React from 'react'
import { Link } from 'react-router-dom'
import { resolveIcon } from '../registry'
import { checkUserPermission } from './MetadataPermissionGuard'
import { useAuth } from '../../context/AuthContext'

export default function MetadataActionRenderer({
  action,
  contextData = null,
  onAction,
  className = '',
  size = 'md', // 'sm' | 'md' | 'icon'
  iconOnly = false,
}) {
  const auth = useAuth()
  if (!action) return null

  // Check permission
  const hasAccess = checkUserPermission(auth?.user, {
    requiredRole: action.requiredRole,
    restrictedRole: action.restrictedRole,
    requiredPermission: action.permission,
  })

  if (!hasAccess) return null

  const IconComponent = resolveIcon(action.icon)

  // Interpolate route params if href is provided (e.g. /view/:id)
  let resolvedHref = action.href
  if (resolvedHref && contextData?.id) {
    resolvedHref = resolvedHref.replace(':id', contextData.id)
  }

  // Variant styling
  const variantStyles = {
    primary: 'bg-purple-700 hover:bg-purple-800 text-white shadow-xs',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs',
    danger: 'bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 shadow-2xs',
    outline: 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs',
    ghost: 'hover:bg-slate-100 text-slate-600',
  }

  const isIcon = iconOnly || size === 'icon' || action.iconOnly

  const sizeStyles = {
    icon: 'h-7 w-7 p-0',
    sm: isIcon ? 'h-7 w-7 p-0' : 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3.5 py-1.5 text-xs font-bold gap-1.5',
  }

  const baseStyle = `inline-flex items-center justify-center rounded-lg font-medium transition cursor-pointer ${
    variantStyles[action.variant || 'outline']
  } ${sizeStyles[size] || sizeStyles.md} ${className}`

  const handleClick = (e) => {
    if (onAction) {
      onAction(action, contextData, e)
    }
  }

  if (resolvedHref && !action.onClick && !action.requiresConfirm) {
    return (
      <Link to={resolvedHref} className={baseStyle} title={action.label} aria-label={action.label}>
        {IconComponent && <IconComponent size={isIcon ? 13 : (size === 'sm' ? 12 : 14)} />}
        {!isIcon && <span>{action.label}</span>}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={baseStyle}
      title={action.label}
      aria-label={action.label}
    >
      {IconComponent && <IconComponent size={isIcon ? 13 : (size === 'sm' ? 12 : 14)} />}
      {!isIcon && <span>{action.label}</span>}
    </button>
  )
}

