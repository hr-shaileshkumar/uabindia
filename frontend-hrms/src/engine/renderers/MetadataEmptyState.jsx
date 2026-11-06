import React from 'react'
import { Inbox, Plus } from 'lucide-react'
import { resolveIcon } from '../registry'

export default function MetadataEmptyState({
  title = 'No records found',
  message = 'There are no items to display matching the current criteria or filters.',
  actionLabel,
  onAction,
  icon = 'Inbox',
}) {
  const IconComponent = resolveIcon(icon, Inbox)

  return (
    <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-2xs">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-3">
        <IconComponent size={28} />
      </div>
      <h3 className="text-sm md:text-base font-extrabold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus size={13} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  )
}
