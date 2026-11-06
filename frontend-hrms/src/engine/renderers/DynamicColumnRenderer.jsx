import React from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Phone, Mail, Eye, Edit3, Trash2, Shield, Calendar, DollarSign } from 'lucide-react'
import MetadataActionRenderer from './MetadataActionRenderer'

// Vibrant harmonious color palettes for employee avatar initials
const AVATAR_PALETTES = [
  'from-violet-600 to-indigo-600 text-white',
  'from-blue-600 to-cyan-600 text-white',
  'from-emerald-600 to-teal-600 text-white',
  'from-rose-500 to-pink-600 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-purple-600 to-fuchsia-600 text-white',
]

function getAvatarPalette(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[idx]
}

export function formatCurrencyINR(value, currency = 'INR') {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return '-'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  } catch {
    return num.toLocaleString('en-IN')
  }
}

export function formatDateString(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

export default function DynamicColumnRenderer({
  column,
  row,
  onAction,
}) {
  const format = column.format || 'text'
  const rawValue = row[column.key]

  switch (format) {
    case 'code': {
      const codeVal = rawValue || row.code || row.employeeCode || row.companyCode || row.projectCode || '-'
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
          {codeVal}
        </span>
      )
    }

    case 'avatar': {
      const name = row[column.nameKey || 'name'] || row.fullName || rawValue || '-'
      const sub = (column.subKey && !['none', 'code', 'employeecode', 'employeeCode'].includes(column.subKey))
        ? (row[column.subKey] || '')
        : ''
      const initials = String(name)
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'EM'
      const palette = getAvatarPalette(name)

      return (
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${palette} font-bold text-xs ring-2 ring-white shadow-xs`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-xs truncate leading-snug">
              {name}
            </div>
            {sub && (
              <div className="mt-0.5 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                {sub}
              </div>
            )}
          </div>
        </div>
      )
    }

    case 'badge': {
      const val = String(rawValue || '-').trim()
      const lower = val.toLowerCase()

      let badgeClasses = 'bg-slate-100 text-slate-700 border-slate-200/70'
      let dotColor = 'bg-slate-400'

      if (lower === 'active' || lower === 'approved' || lower === 'completed') {
        badgeClasses = 'bg-emerald-50/80 text-emerald-700 border-emerald-200/70'
        dotColor = 'bg-emerald-500'
      } else if (lower === 'pending' || lower === 'hold' || lower === 'draft') {
        badgeClasses = 'bg-amber-50/80 text-amber-700 border-amber-200/70'
        dotColor = 'bg-amber-500'
      } else if (lower === 'exited' || lower === 'rejected' || lower === 'inactive') {
        badgeClasses = 'bg-rose-50/80 text-rose-700 border-rose-200/70'
        dotColor = 'bg-rose-500'
      } else if (lower.includes('full time') || lower.includes('permanent')) {
        badgeClasses = 'bg-blue-50/80 text-blue-700 border-blue-200/70'
        dotColor = 'bg-blue-500'
      } else if (lower.includes('contract') || lower.includes('intern')) {
        badgeClasses = 'bg-purple-50/80 text-purple-700 border-purple-200/70'
        dotColor = 'bg-purple-500'
      }

      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClasses}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          <span>{val}</span>
        </span>
      )
    }

    case 'contact': {
      const mobile = row[column.primaryKey || 'mobile'] || row.mobile || row.mobileNumber
      const email = row[column.secondaryKey || 'email'] || row.email || row.companyEmail
      const cleanMobile = mobile && mobile !== '-' ? mobile : null
      const cleanEmail = email && email !== '-' ? email : null

      if (!cleanMobile && !cleanEmail) {
        return <span className="text-slate-300 font-light">—</span>
      }

      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          {cleanMobile && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 truncate">
              <Phone size={11} className="text-slate-400 shrink-0" />
              <span className="truncate">{cleanMobile}</span>
            </div>
          )}
          {cleanEmail && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
              <Mail size={11} className="text-slate-400 shrink-0" />
              <span className="truncate">{cleanEmail}</span>
            </div>
          )}
        </div>
      )
    }

    case 'date':
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span>{formatDateString(rawValue)}</span>
        </div>
      )

    case 'currency':
      return <span className="font-mono text-xs font-bold text-slate-900">{formatCurrencyINR(rawValue)}</span>

    case 'boolean':
      return rawValue ? (
        <Check size={15} className="text-emerald-600" />
      ) : (
        <X size={15} className="text-slate-400" />
      )

    case 'actions': {
      const rowActions = (column.actions && column.actions.length > 0)
        ? column.actions
        : [
            { key: 'view', label: 'View Profile', icon: 'Eye', variant: 'outline' },
            { key: 'edit', label: 'Edit', icon: 'Edit3', variant: 'outline' },
            { key: 'delete', label: 'Delete', icon: 'Trash2', variant: 'danger', requiresConfirm: true },
          ]
      return (
        <div className="flex items-center justify-end">
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200/80 bg-slate-50/70 shadow-2xs">
            {rowActions.map((act, i) => (
              <MetadataActionRenderer
                key={act.key || i}
                action={act}
                contextData={row}
                onAction={onAction}
                size="icon"
                iconOnly={true}
              />
            ))}
          </div>
        </div>
      )
    }

    case 'text':
    default: {
      const primary = column.primaryKey ? row[column.primaryKey] : rawValue
      const secondary = column.secondaryKey ? row[column.secondaryKey] : null

      const cleanPrimary = primary && primary !== '-' ? primary : null
      const cleanSecondary = secondary && secondary !== '-' ? secondary : null

      if (!cleanPrimary && !cleanSecondary) {
        return <span className="text-slate-400 italic text-[11px]">Unassigned</span>
      }

      return (
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-800 truncate">{cleanPrimary || 'General'}</div>
          {cleanSecondary && (
            <div className="mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 truncate max-w-[200px]">
                {cleanSecondary}
              </span>
            </div>
          )}
        </div>
      )
    }
  }
}


