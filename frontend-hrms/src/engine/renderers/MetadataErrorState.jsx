import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function MetadataErrorState({
  title = 'Failed to load module data',
  message = 'An unexpected error occurred while fetching information from the server.',
  onRetry,
}) {
  return (
    <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-2xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-3">
        <AlertCircle size={26} />
      </div>
      <h3 className="text-sm md:text-base font-extrabold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  )
}
